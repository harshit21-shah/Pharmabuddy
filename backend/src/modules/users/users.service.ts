// backend/src/modules/users/users.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

/**
 * Users Service
 * Handles all user-related database operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Find user by WhatsApp ID
   * @param whatsappId - WhatsApp ID (phone number)
   */
  async findByWhatsAppId(whatsappId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ whatsappId });
  }

  /**
   * Find user by phone number
   * @param phoneNumber - Phone number with country code
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOneBy({ phoneNumber });
  }

  /**
   * Find user by ID
   * @param id - User UUID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['medicines', 'reminders', 'caregivers'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Create new user
   * @param data - User data
   */
  async create(data: {
    phoneNumber: string;
    whatsappId: string;
    name?: string;
    age?: number;
    language?: string;
  }): Promise<User> {
    // Check if user already exists
    const existing = await this.findByWhatsAppId(data.whatsappId);
    if (existing) {
      this.logger.log(`User already exists: ${data.whatsappId}`);
      return existing;
    }

    // Create new user
    const user = this.userRepository.create({
      phoneNumber: data.phoneNumber,
      whatsappId: data.whatsappId,
      name: data.name || 'User',
      age: data.age,
      language: data.language || 'en',
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`✅ New user created: ${saved.id}`);

    return saved;
  }

  /**
   * Update user details
   * @param id - User ID
   * @param data - Updated data
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete user (soft delete - just mark as inactive)
   * @param id - User ID
   */
  async softDelete(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
    this.logger.log(`User ${id} marked as inactive`);
  }
}
