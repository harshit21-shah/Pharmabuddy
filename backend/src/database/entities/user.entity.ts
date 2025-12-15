// backend/src/database/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Medicine } from './medicine.entity';
import { Reminder } from './reminder.entity';
import { Caregiver } from './caregiver.entity';

/**
 * User Entity
 * Represents a patient in the system
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phoneNumber: string; // e.g., +919876543210

  @Column({ type: 'varchar', length: 50, unique: true })
  whatsappId: string; // Same as phone number usually

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string; // 'en', 'hi', 'mr'

  @Column({ type: 'varchar', length: 50, default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Medicine, (medicine) => medicine.user)
  medicines: Medicine[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders: Reminder[];

  @OneToMany(() => Caregiver, (caregiver) => caregiver.user)
  caregivers: Caregiver[];
}
