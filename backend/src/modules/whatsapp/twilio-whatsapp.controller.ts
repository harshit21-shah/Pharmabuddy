// backend/src/modules/whatsapp/twilio-whatsapp.controller.ts

import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';

/**
 * Twilio WhatsApp Controller
 * Handles incoming webhook messages from Twilio.
 *
 * This version does NOT depend on RemindersService to avoid circular dependencies.
 * Use the "Simulate Reply" button in the dashboard for full reminder confirmation flow.
 */
@Controller('whatsapp')
export class TwilioWhatsAppController {
  private readonly logger = new Logger(TwilioWhatsAppController.name);

  constructor(private readonly twilioWhatsAppService: TwilioWhatsAppService) { }

  /**
   * POST /whatsapp/webhook
   * Twilio will POST incoming messages here.
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    try {
      this.logger.log('📨 Received Twilio webhook');
      this.logger.debug('Payload:', JSON.stringify(body, null, 2));

      const from = body.From?.replace('whatsapp:', '') || '';
      const to = body.To?.replace('whatsapp:', '') || '';
      const message = (body.Body || '').trim();
      const profileName = body.ProfileName || 'User';

      // Acknowledge receipt to Twilio (empty 200 response)
      await this.twilioWhatsAppService.markAsRead(body.MessageSid);

      // Process the message content
      await this.handleMessage(from, message, profileName);
      return '';
    } catch (err) {
      this.logger.error('Error handling webhook', err);
      return '';
    }
  }

  /**
   * Route incoming messages based on simple keywords.
   */
  private async handleMessage(from: string, text: string, userName: string) {
    const lower = text.toLowerCase();

    // Number responses (1,2,3) for reminder confirmations
    if (['1', '2', '3'].includes(lower)) {
      await this.handleNumberResponse(from, lower);
      return;
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower === 'start') {
      await this.twilioWhatsAppService.sendWelcomeMessage(from, userName);
    } else if (lower.includes('test') || lower.includes('demo')) {
      await this.twilioWhatsAppService.sendMedicineReminder(
        from,
        'Metformin',
        '500mg - Twice daily',
        'demo_reminder_001',
      );
    } else if (lower.includes('help') || lower === '?') {
      await this.twilioWhatsAppService.sendHelpMessage(from);
    } else if (lower.includes('thank')) {
      await this.twilioWhatsAppService.sendTextMessage(
        from,
        "You're welcome! 😊\n\nI'm here to help you stay healthy! 💪",
      );
    } else {
      await this.twilioWhatsAppService.sendTextMessage(
        from,
        `I didn't understand that. Try one of these commands:
- hi / hello
- test
- help`,
      );
    }
  }

  /**
   * Handle numeric replies (1=taken, 2=snooze, 3=skip).
   * This implementation only sends a confirmation message.
   */
  private async handleNumberResponse(from: string, number: string) {
    switch (number) {
      case '1':
        await this.twilioWhatsAppService.sendConfirmation(from, 'taken');
        break;
      case '2':
        await this.twilioWhatsAppService.sendConfirmation(from, 'snoozed');
        break;
      case '3':
        await this.twilioWhatsAppService.sendConfirmation(from, 'skipped');
        break;
      default:
        await this.twilioWhatsAppService.sendTextMessage(from, 'Please reply with 1, 2, or 3');
    }
  }
}
