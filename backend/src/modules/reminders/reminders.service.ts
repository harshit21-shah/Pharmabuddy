// backend/src/modules/reminders/reminders.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { Reminder } from '../../database/entities/reminder.entity';
import { ReminderLog } from '../../database/entities/reminder-log.entity';
import { Medicine } from '../../database/entities/medicine.entity';
import { User } from '../../database/entities/user.entity';
import { Caregiver } from '../../database/entities/caregiver.entity';

/**
 * Reminders Service
 * Handles all reminder scheduling and tracking
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Reminder)
    private reminderRepo: Repository<Reminder>,

    @InjectRepository(ReminderLog)
    private reminderLogRepo: Repository<ReminderLog>,

    @InjectRepository(Medicine)
    private medicineRepo: Repository<Medicine>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Caregiver)
    private caregiverRepo: Repository<Caregiver>,

    @InjectQueue('reminders')
    private reminderQueue: bull.Queue,
  ) { }

  /**
   * Create a new reminder
   */
  async createReminder(data: {
    medicineId: string;
    userId: string;
    scheduledTime: string; // "08:30"
    daysOfWeek: number[]; // [0,1,2,3,4,5,6]
  }): Promise<Reminder> {
    const reminder = this.reminderRepo.create({
      medicineId: data.medicineId,
      userId: data.userId,
      scheduledTime: data.scheduledTime,
      daysOfWeek: data.daysOfWeek,
      isActive: true,
    });

    const saved = await this.reminderRepo.save(reminder);
    this.logger.log(`✅ Reminder created: ${saved.id}`);

    // Schedule it for today if applicable
    await this.scheduleReminderForToday(saved);

    return saved;
  }

  /**
   * Schedule all active reminders for today
   * This runs every day at 12:01 AM
   */
  async scheduleAllTodayReminders(): Promise<void> {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday

    this.logger.log(`📅 Scheduling reminders for today (day ${dayOfWeek})`);

    // Get all active reminders for today
    const reminders = await this.reminderRepo
      .createQueryBuilder('reminder')
      .where('reminder.isActive = :active', { active: true })
      .andWhere(':day = ANY(reminder.daysOfWeek)', { day: dayOfWeek })
      .leftJoinAndSelect('reminder.medicine', 'medicine')
      .leftJoinAndSelect('reminder.user', 'user')
      .getMany();

    this.logger.log(`Found ${reminders.length} reminders for today`);

    for (const reminder of reminders) {
      await this.scheduleReminderForToday(reminder);
    }

    this.logger.log('✅ All reminders scheduled!');
  }

  /**
   * Schedule a specific reminder for today
   */
  private async scheduleReminderForToday(reminder: Reminder): Promise<void> {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Check if reminder is for today
    if (!reminder.daysOfWeek.includes(dayOfWeek)) {
      return;
    }

    // Parse scheduled time (format: "08:30:00" or "08:30")
    const [hours, minutes] = reminder.scheduledTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);

    // Skip if time has already passed
    if (scheduledFor < new Date()) {
      this.logger.debug(`⏭️ Skipping past reminder ${reminder.id}`);
      return;
    }

    // Check if already scheduled
    const existingLog = await this.reminderLogRepo.findOne({
      where: {
        reminderId: reminder.id,
        scheduledFor,
        status: In(['sent', 'confirmed']),
      },
    });

    if (existingLog) {
      this.logger.debug(`Already scheduled: ${reminder.id}`);
      return;
    }

    // Calculate delay in milliseconds
    const delay = scheduledFor.getTime() - Date.now();

    // Add to Bull queue
    await this.reminderQueue.add(
      'send-whatsapp',
      {
        reminderId: reminder.id,
        userId: reminder.userId,
        medicineId: reminder.medicineId,
        scheduledFor: scheduledFor.toISOString(),
      },
      {
        delay: delay > 0 ? delay : 0,
        jobId: `${reminder.id}-${scheduledFor.toISOString()}`,
        removeOnComplete: true,
      }
    );

    this.logger.log(
      `📅 Scheduled: ${reminder.id} at ${scheduledFor.toLocaleTimeString()} (in ${Math.round(delay / 1000)}s)`
    );
  }

  /**
   * Confirm reminder (from WhatsApp or Voice)
   */
  async confirmReminder(
    reminderId: string,
    userId: string,
    source: 'whatsapp' | 'voice' = 'whatsapp'
  ): Promise<void> {
    const log = await this.reminderLogRepo.findOne({
      where: { reminderId, userId },
      order: { createdAt: 'DESC' },
    });

    if (!log) {
      this.logger.warn(`No log found for reminder ${reminderId}`);
      return;
    }

    log.status = 'confirmed';
    log.confirmedAt = new Date();
    log.confirmationSource = source;
    await this.reminderLogRepo.save(log);

    // Update medicine stock (decrease by 1)
    const reminder = await this.reminderRepo.findOne({
      where: { id: reminderId },
      relations: ['medicine'],
    });

    if (reminder?.medicine && reminder.medicine.stockQuantity > 0) {
      reminder.medicine.stockQuantity -= 1;
      await this.medicineRepo.save(reminder.medicine);
      this.logger.log(`📉 Stock updated: ${reminder.medicine.name} (${reminder.medicine.stockQuantity} left)`);

      // Check for low stock
      if (reminder.medicine.stockQuantity <= reminder.medicine.lowStockThreshold) {
        await this.reminderQueue.add('low-stock-alert', {
          userId,
          medicine: reminder.medicine,
        });
        this.logger.warn(`⚠️ Low stock alert triggered for ${reminder.medicine.name}`);
      }
    }

    // Cancel any pending escalation jobs
    await this.cancelEscalationJobs(reminderId);

    this.logger.log(`✅ Reminder confirmed via ${source}: ${reminderId}`);
  }

  /**
   * Schedule voice escalation
   */
  async scheduleVoiceEscalation(
    reminderId: string,
    userId: string,
    delayMinutes: number = 15
  ): Promise<void> {
    await this.reminderQueue.add(
      'send-voice',
      { reminderId, userId },
      {
        delay: delayMinutes * 60 * 1000,
        jobId: `voice-${reminderId}-${Date.now()}`,
        removeOnComplete: true,
      }
    );

    this.logger.log(`📞 Voice escalation scheduled in ${delayMinutes} min for ${reminderId}`);
  }

  /**
   * Schedule caregiver escalation
   */
  async scheduleCaregiverEscalation(
    reminderId: string,
    userId: string,
    delayMinutes: number = 15
  ): Promise<void> {
    await this.reminderQueue.add(
      'alert-caregiver',
      { reminderId, userId },
      {
        delay: delayMinutes * 60 * 1000,
        jobId: `caregiver-${reminderId}-${Date.now()}`,
        removeOnComplete: true,
      }
    );

    this.logger.log(`🚨 Caregiver alert scheduled in ${delayMinutes} min for ${reminderId}`);
  }

  /**
   * Escalate to caregiver (final step)
   */
  async escalateToCaregiver(reminderId: string, userId: string): Promise<void> {
    // Check if already confirmed
    const log = await this.reminderLogRepo.findOne({
      where: { reminderId, userId, status: 'confirmed' },
    });

    if (log) {
      this.logger.log(`Already confirmed, no escalation needed: ${reminderId}`);
      return;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const reminder = await this.reminderRepo.findOne({
      where: { id: reminderId },
      relations: ['medicine'],
    });
    const caregivers = await this.caregiverRepo.find({
      where: { userId, shouldNotify: true },
    });

    if (caregivers.length === 0) {
      this.logger.warn(`No caregivers found for user ${userId}`);
      return;
    }

    const missedTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });

    this.logger.log(`🚨 Alerting ${caregivers.length} caregivers for user ${userId}`);

    // Update log
    const latestLog = await this.reminderLogRepo.findOne({
      where: { reminderId, userId },
      order: { createdAt: 'DESC' },
    });

    if (latestLog) {
      latestLog.status = 'escalated';
      latestLog.escalatedAt = new Date();
      await this.reminderLogRepo.save(latestLog);
    }

    // Return caregiver data for WhatsApp service to send
    return {
      user,
      medicine: reminder?.medicine,
      caregivers,
      missedTime,
    } as any;
  }

  /**
   * Snooze reminder (schedule another attempt)
   */
  async snoozeReminder(reminderId: string, minutes: number): Promise<void> {
    const reminder = await this.reminderRepo.findOne({
      where: { id: reminderId },
    });

    if (!reminder) return;

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);

    await this.reminderQueue.add(
      'send-whatsapp',
      {
        reminderId: reminder.id,
        userId: reminder.userId,
        medicineId: reminder.medicineId,
        scheduledFor: snoozeUntil.toISOString(),
      },
      {
        delay: minutes * 60 * 1000,
        jobId: `snooze-${reminderId}-${Date.now()}`,
        removeOnComplete: true,
      }
    );

    this.logger.log(`⏰ Reminder snoozed for ${minutes} minutes: ${reminderId}`);
  }

  /**
   * Skip reminder
   */
  async skipReminder(reminderId: string, userId: string): Promise<void> {
    const log = await this.reminderLogRepo.findOne({
      where: { reminderId, userId },
      order: { createdAt: 'DESC' },
    });

    if (log) {
      log.status = 'skipped';
      await this.reminderLogRepo.save(log);
      this.logger.log(`⏭️ Reminder skipped: ${reminderId}`);
    }

    // Cancel escalations
    await this.cancelEscalationJobs(reminderId);
  }

  /**
   * Cancel all pending escalation jobs for a reminder
   */
  private async cancelEscalationJobs(reminderId: string): Promise<void> {
    try {
      const jobs = await this.reminderQueue.getJobs(['delayed', 'waiting']);

      const jobsToCancel = jobs.filter(job =>
        job.data.reminderId === reminderId
      );

      for (const job of jobsToCancel) {
        await job.remove();
        this.logger.debug(`Cancelled job: ${job.name} for ${reminderId}`);
      }
    } catch (error) {
      this.logger.error('Error cancelling jobs:', error.message);
    }
  }

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string): Promise<Reminder[]> {
    return this.reminderRepo.find({
      where: { userId, isActive: true },
      relations: ['medicine'],
      order: { scheduledTime: 'ASC' },
    });
  }

  /**
   * Get reminder logs for today
   */
  async getTodayLogs(userId: string): Promise<ReminderLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.reminderLogRepo.find({
      where: { userId },
      relations: ['medicine'],
      order: { scheduledFor: 'ASC' },
    });
  }
}