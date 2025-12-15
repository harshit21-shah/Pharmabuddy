// backend/src/modules/reminders/reminders.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import bull from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwilioWhatsAppService } from '../whatsapp/twilio-whatsapp.service';
import { VoiceService } from '../voice/voice.service';
import { RemindersService } from './reminders.service';
import { User } from '../../database/entities/user.entity';
import { Medicine } from '../../database/entities/medicine.entity';
import { ReminderLog } from '../../database/entities/reminder-log.entity';

/**
 * Reminders Processor
 * Processes all reminder jobs from Bull queue
 */
@Processor('reminders')
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly whatsappService: TwilioWhatsAppService,
    private readonly voiceService: VoiceService,
    private readonly remindersService: RemindersService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Medicine)
    private medicineRepo: Repository<Medicine>,
    @InjectRepository(ReminderLog)
    private reminderLogRepo: Repository<ReminderLog>,
  ) { }

  /**
   * STEP 1: Send WhatsApp Reminder
   * This is the first step of escalation
   */
  @Process('send-whatsapp')
  async handleSendWhatsApp(job: bull.Job) {
    const { reminderId, userId, medicineId, scheduledFor } = job.data;

    try {
      this.logger.log(`📱 STEP 1: Sending WhatsApp reminder ${reminderId}`);

      // Get user and medicine details
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const medicine = await this.medicineRepo.findOne({ where: { id: medicineId } });

      if (!user || !medicine) {
        this.logger.error('User or medicine not found');
        return;
      }

      // Create reminder log
      const log = this.reminderLogRepo.create({
        reminderId,
        userId,
        medicineId,
        scheduledFor: new Date(scheduledFor),
        status: 'sent',
        sentAt: new Date(),
      });
      await this.reminderLogRepo.save(log);

      // Send WhatsApp reminder
      const success = await this.whatsappService.sendMedicineReminder(
        user.phoneNumber,
        medicine.name,
        medicine.dosage,
        reminderId
      );

      if (success) {
        this.logger.log(`✅ WhatsApp sent to ${user.phoneNumber}`);

        // Schedule voice escalation in 15 minutes
        await this.remindersService.scheduleVoiceEscalation(reminderId, userId, 15);
      } else {
        this.logger.error('WhatsApp failed, escalating to voice immediately');
        await this.remindersService.scheduleVoiceEscalation(reminderId, userId, 0);
      }

    } catch (error) {
      this.logger.error(`Error in Step 1:`, error.message);
      throw error;
    }
  }

  /**
   * STEP 2: Make Voice Call (if WhatsApp not confirmed)
   * This is triggered 15 minutes after WhatsApp
   */
  @Process('send-voice')
  async handleSendVoice({ job }: { job: bull.Job; }) {
    const { reminderId, userId } = job.data;

    try {
      this.logger.log(`📞 STEP 2: Voice escalation for ${reminderId}`);

      // Check if already confirmed via WhatsApp
      const log = await this.reminderLogRepo.findOne({
        where: { reminderId, userId, status: 'confirmed' },
      });

      if (log) {
        this.logger.log(`✅ Already confirmed via WhatsApp, skipping voice`);
        return;
      }

      // Get user details
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.error('User not found');
        return;
      }

      // Get the latest log to find medicine
      const latestLog = await this.reminderLogRepo.findOne({
        where: { reminderId, userId },
        order: { createdAt: 'DESC' },
        relations: ['medicine'],
      });

      if (!latestLog || !latestLog.medicine) {
        this.logger.error('No log or medicine found');
        return;
      }

      this.logger.log(`📞 Calling ${user.phoneNumber} about ${latestLog.medicine.name}`);

      // Make voice call
      const callResult = await this.voiceService.makeReminderCall(
        user.phoneNumber,
        user.name,
        latestLog.medicine.name,
        latestLog.medicine.dosage,
        reminderId
      );

      // Update log with voice call info
      latestLog.voiceCallId = callResult.callSid;
      latestLog.voiceCallStatus = 'initiated';
      await this.reminderLogRepo.save(latestLog);

      // Schedule caregiver escalation in 15 minutes
      await this.remindersService.scheduleCaregiverEscalation(reminderId, userId, 15);

      this.logger.log(`✅ Voice call initiated: ${callResult.callSid}`);

    } catch (error) {
      this.logger.error(`Error in Step 2:`, error.message);

      // If voice fails, escalate to caregiver immediately
      await this.remindersService.scheduleCaregiverEscalation(reminderId, userId, 0);
    }
  }

  /**
   * STEP 3: Alert Caregiver (if still not confirmed)
   * This is triggered 15 minutes after voice call
   */
  @Process('alert-caregiver')
  async handleAlertCaregiver(job: bull.Job) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { reminderId, userId } = job.data;

    try {
      this.logger.log(`🚨 STEP 3: Caregiver alert for ${reminderId}`);

      // Check if confirmed
      const log = await this.reminderLogRepo.findOne({
        where: { reminderId, userId, status: 'confirmed' },
      });

      if (log) {
        this.logger.log(`✅ Confirmed, no caregiver alert needed`);
        return;
      }

      // Escalate to caregiver
      const result = (await this.remindersService.escalateToCaregiver(
        reminderId,
        userId
      )) as unknown as {
        user: User;
        medicine: Medicine;
        caregivers: any[];
        missedTime: any;
      } | null;

      if (!result) {
        this.logger.warn('No caregivers or medicine to notify');
        return;
      }

      const { user, medicine, caregivers, missedTime } = result;

      if (!medicine) {
        this.logger.warn('No medicine found');
        return;
      }

      // Send WhatsApp to all caregivers
      for (const caregiver of caregivers) {
        const message = `🚨 *Medicine Alert*

${user.name} has NOT confirmed taking:

💊 *${medicine.name}*
📋 Dosage: ${medicine.dosage}
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/restrict-template-expressions
⏰ Scheduled: ${missedTime}

Please check on them!

- PharmaBuddy`;

        await this.whatsappService.sendTextMessage(
          caregiver.phoneNumber,
          message
        );

        this.logger.log(`🚨 Caregiver notified: ${caregiver.name}`);
      }

      this.logger.log(`✅ All caregivers alerted`);

    } catch (error) {
      this.logger.error(`Error in Step 3:`, error.message);
    }
  }

  /**
   * LOW STOCK ALERT
   * Triggered when stock falls below threshold
   */
  @Process('low-stock-alert')
  async handleLowStockAlert(job: bull.Job) {
    const { userId, medicine } = job.data;
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return;

      const message = `⚠️ *Low Stock Alert*

Your supply of *${medicine.name}* is running low (${medicine.stockQuantity} remaining).
Please refill your prescription soon to avoid missing doses.

- PharmaBuddy`;

      await this.whatsappService.sendTextMessage(user.phoneNumber, message);
      this.logger.log(`⚠️ Low stock alert sent to ${user.name}`);
    } catch (error) {
      this.logger.error(`Error sending low stock alert:`, error.message);
    }
  }
}