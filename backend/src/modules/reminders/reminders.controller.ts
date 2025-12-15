// backend/src/modules/reminders/reminders.controller.ts

import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Reminders Controller
 * Test endpoints for reminder system
 */
@Controller('reminders')
export class RemindersController {
  private readonly logger = new Logger(RemindersController.name);

  constructor(
    private readonly remindersService: RemindersService,
    @InjectQueue('reminders') private readonly reminderQueue: any,
  ) { }

  /**
   * POST /api/reminders/create
   * Create a new reminder
   */
  @Post('create')
  async createReminder(@Body() body: {
    medicineId: string;
    userId: string;
    scheduledTime: string; // "08:30"
    daysOfWeek: number[]; // [1,2,3,4,5] for weekdays
  }) {
    return this.remindersService.createReminder(body);
  }

  /**
   * POST /api/reminders/schedule-today
   * Manually trigger scheduling for today (for testing)
   */
  @Post('schedule-today')
  async scheduleToday() {
    await this.remindersService.scheduleAllTodayReminders();
    return { message: 'Today\'s reminders scheduled!' };
  }

  /**
   * POST /api/reminders/:id/confirm
   * Manually confirm a reminder (for testing)
   */
  @Post(':id/confirm')
  async confirmReminder(
    @Param('id') reminderId: string,
    @Body('userId') userId: string,
    @Body('source') source: 'whatsapp' | 'voice' = 'whatsapp'
  ) {
    await this.remindersService.confirmReminder(reminderId, userId, source);
    return { message: 'Reminder confirmed!' };
  }

  /**
   * GET /api/reminders/user/:userId
   * Get all reminders for a user
   */
  @Get('user/:userId')
  async getUserReminders(@Param('userId') userId: string) {
    return this.remindersService.getUserReminders(userId);
  }

  /**
   * GET /api/reminders/logs/:userId
   * Get today's reminder logs for a user
   */
  @Get('logs/:userId')
  async getTodayLogs(@Param('userId') userId: string) {
    return this.remindersService.getTodayLogs(userId);
  }

  /**
   * POST /api/reminders/test-flow
   * Test the ENTIRE escalation flow (for demo)
   * Creates a reminder 2 minutes from now
   */
  @Post('test-flow')
  async testFlow(@Body() body: {
    userId: string;
    medicineId: string;
    type?: 'whatsapp' | 'voice';
  }) {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 5); // 5 seconds from now

    const scheduledTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const dayOfWeek = now.getDay();

    // Create dummy reminder in DB so foreign keys work
    const reminder = await this.remindersService.createReminder({
      medicineId: body.medicineId,
      userId: body.userId,
      scheduledTime: scheduledTime,
      daysOfWeek: [dayOfWeek],
    });

    // Manually trigger the job immediately (bypass scheduler logic)
    // Manually trigger the job immediately (bypass scheduler logic)
    if (body.type === 'voice') {
      await this.reminderQueue.add(
        'send-voice',
        {
          reminderId: reminder.id,
          userId: body.userId,
        },
        {
          delay: 5000,
          removeOnComplete: true,
        }
      );
    } else {
      await this.reminderQueue.add(
        'send-whatsapp',
        {
          reminderId: reminder.id,
          userId: body.userId,
          medicineId: body.medicineId,
          scheduledFor: now.toISOString(),
        },
        {
          delay: 5000,
          removeOnComplete: true,
        }
      );
    }

    return {
      message: 'Test reminder created & queued!',
      reminder,
      willTriggerAt: now.toLocaleString(),
      note: 'WhatsApp will be sent in 5 seconds. If not confirmed, voice call in 17 minutes, caregiver alert in 32 minutes.'
    };
  }
}