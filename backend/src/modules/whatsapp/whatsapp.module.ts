// backend/src/modules/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwilioWhatsAppController } from './twilio-whatsapp.controller';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';

/**
 * WhatsApp Module
 * Bundles all WhatsApp-related functionality
 */
@Module({
  imports: [
    ConfigModule, // Allows us to read .env variables
  ],
  controllers: [TwilioWhatsAppController],
  providers: [TwilioWhatsAppService],
  exports: [TwilioWhatsAppService], // Other modules can use this service
})
export class WhatsAppModule { }