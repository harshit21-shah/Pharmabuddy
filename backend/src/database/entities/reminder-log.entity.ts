// backend/src/database/entities/reminder-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Medicine } from './medicine.entity';
import { Reminder } from './reminder.entity';

/**
 * Reminder Log Entity
 * Tracks each reminder sent and its outcome
 */
@Entity('reminder_logs')
export class ReminderLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reminderId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  medicineId: string;

  @Column({ type: 'timestamp' })
  scheduledFor: Date; // When the reminder was supposed to be sent

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date; // When WhatsApp message was actually sent

  @Column({ type: 'varchar', length: 20 })
  status: string; // 'sent', 'confirmed', 'escalated', 'skipped'

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date; // When patient confirmed taking medicine

  @Column({ type: 'varchar', length: 20, nullable: true })
  confirmationSource: string; // 'whatsapp' or 'voice'

  @Column({ type: 'varchar', length: 100, nullable: true })
  voiceCallId: string; // Twilio Call SID

  @Column({ type: 'varchar', length: 50, nullable: true })
  voiceCallStatus: string; // 'initiated', 'completed', 'failed', 'no_answer'

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date; // When caregivers were alerted

  @Column({ type: 'text', nullable: true })
  skippedReason: string; // Why patient skipped (optional)

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Reminder, (reminder) => reminder.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reminderId' })
  reminder: Reminder;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Medicine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;
}
