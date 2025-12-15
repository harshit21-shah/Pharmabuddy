// backend/src/modules/voice/voice.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';

/**
 * Voice Module
 * Handles all voice calling functionality
 */
@Module({
  imports: [
    ConfigModule, // Allows us to read .env variables
  ],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService], // Other modules can use VoiceService
})
export class VoiceModule {}