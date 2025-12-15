// backend/src/database/entities/reminder.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Medicine } from './medicine.entity';
import { ReminderLog } from './reminder-log.entity';

/**
 * Reminder Entity
 * Represents a scheduled medicine reminder
 */
@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  medicineId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'time' })
  scheduledTime: string; // e.g., "08:30:00"

  @Column({ type: 'simple-array' })
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] for Sun-Sat, e.g., [1,2,3,4,5] for weekdays

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSentAt: Date; // Last time reminder was sent

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Medicine, (medicine) => medicine.reminders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @ManyToOne(() => User, (user) => user.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ReminderLog, (log) => log.reminder)
  logs: ReminderLog[];
}
