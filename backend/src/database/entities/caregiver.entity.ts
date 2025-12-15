// backend/src/database/entities/caregiver.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Caregiver Entity
 * Represents family members or caregivers to notify
 */
@Entity('caregivers')
export class Caregiver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string; // Which patient this caregiver is for

  @Column({ type: 'varchar', length: 15 })
  phoneNumber: string; // Caregiver's phone number

  @Column({ type: 'varchar', length: 50, nullable: true })
  whatsappId: string; // Caregiver's WhatsApp ID

  @Column({ type: 'varchar', length: 100 })
  name: string; // Caregiver's name

  @Column({ type: 'varchar', length: 50, nullable: true })
  relationship: string; // 'son', 'daughter', 'spouse', 'nurse', etc.

  @Column({ type: 'boolean', default: true })
  shouldNotify: boolean; // If false, don't send alerts to this caregiver

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.caregivers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
