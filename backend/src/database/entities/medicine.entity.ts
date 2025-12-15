// backend/src/database/entities/medicine.entity.ts

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
import { Reminder } from './reminder.entity';

/**
 * Medicine Entity
 * Represents a medicine that a patient takes
 */
@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string; // e.g., "Metformin"

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string; // e.g., "500mg", "2 tablets"

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequency: string; // e.g., "daily", "twice_daily", "weekly"

  @Column({ type: 'int', default: 0 })
  stockQuantity: number; // How many pills left

  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number; // Alert when stock below this

  @Column({ type: 'text', nullable: true })
  notes: string; // Any additional notes

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.medicines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Reminder, (reminder) => reminder.medicine)
  reminders: Reminder[];
}
