// backend/src/modules/reminders/reminders.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { Reminder } from '../../database/entities/reminder.entity';
import { ReminderLog } from '../../database/entities/reminder-log.entity';
import { Medicine } from '../../database/entities/medicine.entity';
import { User } from '../../database/entities/user.entity';
import { Caregiver } from '../../database/entities/caregiver.entity';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [
    // Register entities
    TypeOrmModule.forFeature([
      Reminder,
      ReminderLog,
      Medicine,
      User,
      Caregiver,
    ]),

    // Register Bull queue
    BullModule.registerQueue({
      name: 'reminders',
    }),
    // Import other modules we depend on
    WhatsAppModule,
    VoiceModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule {}