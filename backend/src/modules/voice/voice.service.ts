// backend/src/modules/voice/voice.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

/**
 * Voice Service
 * Handles all voice calling operations via Twilio
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly twilioClient: twilio.Twilio;
  private readonly fromNumber: string;
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    // Get credentials from .env
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_VOICE_NUMBER', '');
    this.appUrl = this.configService.get<string>('APP_URL', '');

    // Create Twilio client
    this.twilioClient = twilio(accountSid, authToken);

    this.logger.log('✅ Twilio Voice Service initialized');
  }

  /**
   * Make a voice call to remind patient about medicine
   *
   * @param to - Phone number to call (e.g., +919876543210)
   * @param patientName - Patient's name
   * @param medicineName - Name of medicine
   * @param dosage - Dosage amount
   * @param reminderId - Unique reminder ID (to track in database later)
   * @returns Call SID (unique call identifier)
   */
  async makeReminderCall(
    to: string,
    patientName: string,
    medicineName: string,
    dosage: string,
    reminderId: string
  ): Promise<{ callSid: string }> {
    try {
      this.logger.log(`📞 Initiating call to ${to} for ${medicineName}`);

      // Make the call
      // Twilio will fetch TwiML from our webhook URL
      const call = await this.twilioClient.calls.create({
        to: to,                                  // Who to call
        from: this.fromNumber,                   // Our Twilio number
        
        // URL where Twilio will GET the call instructions (TwiML)
        url: `${this.appUrl}/api/voice/twiml?` + 
             `name=${encodeURIComponent(patientName)}&` +
             `medicine=${encodeURIComponent(medicineName)}&` +
             `dosage=${encodeURIComponent(dosage)}&` +
             `reminderId=${reminderId}`,
        
        method: 'POST',                          // Use POST to get TwiML
        
        // Status callback - called when call ends
        statusCallback: `${this.appUrl}/api/voice/status`,
        statusCallbackEvent: ['answered', 'completed'],
        statusCallbackMethod: 'POST',
        
        record: false,  // Set to true if you want to record calls
        timeout: 30,    // Ring for 30 seconds before giving up
      });

      this.logger.log(`✅ Call initiated! SID: ${call.sid}`);
      
      return { callSid: call.sid };

    } catch (error) {
      this.logger.error(`❌ Failed to initiate call to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate TwiML (Twilio Markup Language)
   * This is the "script" for what the AI voice will say and do
   * 
   * @param params - Call parameters (name, medicine, etc.)
   * @returns TwiML XML string
   */
  generateTwiML(params: {
    name: string;
    medicine: string;
    dosage: string;
    reminderId: string;
  }): string {
    const { name, medicine, dosage, reminderId } = params;

    // Build the voice script in TwiML format
    // <Say> = Text-to-speech
    // <Gather> = Collect user input (DTMF digits)
    // <Pause> = Wait (in seconds)
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">
    Hello ${name}. This is your medicine reminder from Pharma Buddy.
  </Say>
  <Pause length="1"/>
  
  <Say voice="Polly.Aditi" language="en-IN">
    It's time to take your ${medicine}, ${dosage}.
  </Say>
  <Pause length="1"/>
  
  <Gather 
    input="dtmf" 
    timeout="10" 
    numDigits="1" 
    action="${this.appUrl}/api/voice/handle-response?reminderId=${reminderId}"
    method="POST">
    <Say voice="Polly.Aditi" language="en-IN">
      Have you taken your medicine? Press 1 for yes, Press 2 for no, or Press 3 to be reminded again in 15 minutes.
    </Say>
  </Gather>
  
  <Say voice="Polly.Aditi" language="en-IN">
    I didn't receive your response. I'll alert your caregiver. Please take your medicine soon. Goodbye.
  </Say>
  <Hangup/>
</Response>`;

    return twiml;
  }

  /**
   * Generate TwiML for user's response (after they press 1, 2, or 3)
   * 
   * @param digit - Which key they pressed (1, 2, or 3)
   * @returns TwiML XML string
   */
  generateResponseTwiML(digit: string): string {
    let message: string;

    switch (digit) {
      case '1':
        message = 'Great! I have recorded that you took your medicine. Stay healthy!';
        break;
      case '2':
        message = 'Okay. Please remember to take your medicine soon. I will let your caregiver know.';
        break;
      case '3':
        message = 'No problem. I will call you back in 15 minutes.';
        break;
      default:
        message = 'Sorry, I did not understand. Please try again.';
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${message}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">Goodbye!</Say>
  <Hangup/>
</Response>`;
  }

  /**
   * Get details of a specific call
   * 
   * @param callSid - Call SID (from makeReminderCall)
   * @returns Call information
   */
  async getCallDetails(callSid: string): Promise<any> {
    try {
      const call = await this.twilioClient.calls(callSid).fetch();
      
      return {
        sid: call.sid,
        status: call.status,          // queued, ringing, in-progress, completed, etc.
        duration: call.duration,      // Call duration in seconds
        direction: call.direction,    // outbound-api
        answeredBy: call.answeredBy,  // human, machine, fax, or unknown
        from: call.from,
        to: call.to,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch call ${callSid}:`, error.message);
      return null;
    }
  }
}