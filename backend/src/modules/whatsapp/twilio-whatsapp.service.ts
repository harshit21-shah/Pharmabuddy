// backend/src/modules/whatsapp/twilio-whatsapp.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

/**
 * Twilio WhatsApp Service
 * Handles all WhatsApp messaging via Twilio API
 */
@Injectable()
export class TwilioWhatsAppService {
  private readonly logger = new Logger(TwilioWhatsAppService.name);
  private twilioClient: any;
  private readonly fromNumber: string;


  constructor(private configService: ConfigService) {
    // Get credentials from .env file
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    // Create Twilio client
    this.twilioClient = twilio.default(accountSid, authToken);

    this.logger.log('✅ Twilio WhatsApp Service initialized');
  }

  /**
   * Send a simple text message
   * 
   * @param to - Phone number with country code (e.g., +919876543210)
   * @param message - Text to send
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      this.logger.log(`📤 Sending message to ${to}`);

      // Send message via Twilio
      const result = await this.twilioClient.messages.create({
        from: `whatsapp:${this.fromNumber}`,  // From: Twilio sandbox number
        to: `whatsapp:${to}`,                  // To: User's WhatsApp
        body: message                          // Message text
      });

      this.logger.log(`✅ Message sent! SID: ${result.sid}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Failed to send message:`, error.message);
      return false;
    }
  }

  /**
   * Send welcome message
   * 
   * @param to - Phone number
   * @param userName - User's name (optional)
   */
  async sendWelcomeMessage(to: string, userName?: string): Promise<boolean> {
    const greeting = userName ? `Hi ${userName}! 👋` : 'Hi there! 👋';

    const message = `${greeting}

Welcome to *PharmaBuddy*! 💊

I'll help you never miss your medicines.

*Quick Commands:*
• Type "test" - See demo reminder
• Type "help" - Get help
• Type "add medicine" - Coming soon!

What would you like to do?`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send medicine reminder
   * Note: Twilio sandbox doesn't support interactive buttons
   * So we use numbered options instead (user replies with 1, 2, or 3)
   * 
   * @param to - Phone number
   * @param medicineName - Name of medicine
   * @param dosage - Dosage amount
   * @param reminderId - Unique reminder ID
   */
  async sendMedicineReminder(
    to: string,
    medicineName: string,
    dosage: string,
    reminderId: string
  ): Promise<boolean> {
    const message = `⏰ *Medicine Reminder*

💊 *${medicineName}*
📋 Dosage: ${dosage}

Have you taken your medicine?

*Reply with:*
1️⃣ - Yes, taken
2️⃣ - Remind me in 10 min
3️⃣ - Skip this dose

Just type the number (1, 2, or 3)`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send help message
   */
  async sendHelpMessage(to: string): Promise<boolean> {
    const message = `*PharmaBuddy Help* 📖

*Available Commands:*
• "hi" or "hello" - Start conversation
• "test" - Try demo reminder
• "help" - Show this message
• "add medicine" - Coming soon!

*During Reminders:*
Reply with 1, 2, or 3 to:
• 1 = Confirm taken
• 2 = Snooze 10 minutes  
• 3 = Skip dose

Need more help? Just ask! 😊`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send confirmation message
   */
  async sendConfirmation(to: string, type: 'taken' | 'snoozed' | 'skipped'): Promise<boolean> {
    let message = '';

    switch (type) {
      case 'taken':
        message = '✅ *Great job!*\n\nMedicine marked as taken.\nStay healthy! 💪';
        break;
      case 'snoozed':
        message = '⏰ *Reminder Snoozed*\n\nI\'ll remind you again in 10 minutes.';
        break;
      case 'skipped':
        message = '❌ *Dose Skipped*\n\nMarked as skipped.\nPlease try to take it when you can.';
        break;
    }

    return this.sendTextMessage(to, message);
  }

  /**
   * Mark as read (not needed for Twilio, just logging)
   */
  async markAsRead(messageId: string): Promise<void> {
    this.logger.debug(`📨 Message received: ${messageId}`);
  }
}