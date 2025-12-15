// backend/src/modules/voice/voice.controller.ts

import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Res,
  Logger,
} from '@nestjs/common';
import express from 'express';
import { VoiceService } from './voice.service';

/**
 * Voice Controller
 * Handles all voice call webhooks from Twilio
 */
@Controller('voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(private readonly voiceService: VoiceService) {}

  /**
   * GET/POST /api/voice/twiml
   *
   * Twilio calls this endpoint to get instructions for the call
   * This is called IMMEDIATELY when the call is answered
   *
   * We return TwiML (XML) that tells Twilio what to say/do
   */
  @Post('twiml')
  @Get('twiml')
  getTwiML(
    @Query('name') name: string,
    @Query('medicine') medicine: string,
    @Query('dosage') dosage: string,
    @Query('reminderId') reminderId: string,
    @Res() res: express.Response,
  ) {
    this.logger.log(`📝 Generating TwiML for call to ${name}`);
    this.logger.log(`Medicine: ${medicine} ${dosage}`);

    // Generate the voice script (TwiML)
    const twiml = this.voiceService.generateTwiML({
      name,
      medicine,
      dosage,
      reminderId,
    });

    // Send TwiML as XML response
    res.type('text/xml');
    res.send(twiml);
  }

  /**
   * POST /api/voice/handle-response
   *
   * Called when user presses a digit (1, 2, or 3)
   * We need to respond with more TwiML
   */
  @Post('handle-response')
  handleResponse(
    @Query('reminderId') reminderId: string,
    @Body('Digits') digits: string,
    @Res() res: express.Response,
  ) {
    this.logger.log(`🔢 User pressed: ${digits} for reminder ${reminderId}`);

    try {
      // Process the response
      switch (digits) {
        case '1':
          this.logger.log('✅ Patient confirmed taking medicine');
          // TODO: Update database - mark reminder as confirmed
          // TODO: Cancel caregiver alert
          break;

        case '2':
          this.logger.log('❌ Patient did NOT take medicine');
          // TODO: Alert caregiver immediately
          break;

        case '3':
          this.logger.log('⏰ Patient wants reminder in 15 minutes');
          // TODO: Schedule another call in 15 minutes
          break;

        default:
          this.logger.warn(`⚠️ Invalid digit pressed: ${digits}`);
      }

      // Generate response TwiML (what to say after button press)
      const twiml = this.voiceService.generateResponseTwiML(digits);

      // Send TwiML response
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      this.logger.error('Error handling voice response:', error);
      // Send error TwiML
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, something went wrong. Please try again later. Goodbye.</Say>
  <Hangup/>
</Response>`);
    }
  }

  /**
   * POST /api/voice/status
   *
   * Twilio calls this when call status changes
   * (answered, completed, busy, no-answer, failed, etc.)
   *
   * This is how we track if calls were successful
   */
  @Post('status')
  handleStatus(@Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { CallSid, CallStatus, CallDuration, AnsweredBy } = body;

    this.logger.log(`📊 Call ${CallSid} status: ${CallStatus}`);
    if (CallDuration) {
      this.logger.log(`⏱️ Duration: ${CallDuration} seconds`);
    }

    if (AnsweredBy) {
      this.logger.log(`👤 Answered by: ${AnsweredBy}`);
    }

    // Handle different statuses
    switch (CallStatus) {
      case 'completed':
        this.logger.log('✅ Call completed successfully');
        // TODO: If no response received, escalate to caregiver
        break;

      case 'no-answer':
        this.logger.log('📵 Call not answered');
        // TODO: Escalate to caregiver immediately
        break;

      case 'busy':
        this.logger.log('📵 Line was busy');
        // TODO: Try again in 5 minutes or escalate
        break;

      case 'failed':
      case 'canceled':
        this.logger.error(`❌ Call ${CallStatus}`);
        // TODO: Escalate to caregiver
        break;
    }

    // Log for database (we'll implement this later)
    // TODO: Update reminder_logs table with call status

    return { status: 'received' };
  }

  /**
   * POST /api/voice/test
   *
   * Test endpoint to manually trigger a call
   * Remove this in production!
   */
  @Post('test')
  async testCall(
    @Body('to') to: string,
    @Body('name') name: string = 'Test User',
    @Body('medicine') medicine: string = 'Metformin',
    @Body('dosage') dosage: string = '500mg',
  ) {
    this.logger.log(`🧪 TEST CALL initiated to ${to}`);

    try {
      const result = await this.voiceService.makeReminderCall(
        to,
        name,
        medicine,
        dosage,
        'test_call_' + Date.now()
      );

      return {
        success: true,
        message: 'Call initiated successfully',
        callSid: result.callSid,
        note: 'Check your phone! You should receive a call in a few seconds.'
      };
    } catch (error) {
      this.logger.error('Test call failed:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: error.message
      };
    }
  }
}
