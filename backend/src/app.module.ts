// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { VoiceModule } from './modules/voice/voice.module';
import { UsersModule } from './modules/users/users.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { MedicinesModule } from './modules/medicines/medicines.module';
import { CaregiversModule } from './modules/caregivers/caregivers.module';

import { User } from './database/entities/user.entity';
import { Medicine } from './database/entities/medicine.entity';
import { Reminder } from './database/entities/reminder.entity';
import { ReminderLog } from './database/entities/reminder-log.entity';
import { Caregiver } from './database/entities/caregiver.entity';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Medicine, Reminder, ReminderLog, Caregiver],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Bull Queue (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Feature modules
    WhatsAppModule,
    VoiceModule,
    UsersModule,
    RemindersModule,
    MedicinesModule,
    CaregiversModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }