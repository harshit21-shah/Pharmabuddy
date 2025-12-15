// backend/src/modules/users/users.controller.ts

import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Users Controller
 * API endpoints for user management
 */
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users
   * Get all users
   */
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * POST /api/users
   * Create new user
   */
  @Post()
  async createUser(
    @Body()
    body: {
    phoneNumber: string;
    whatsappId: string;
    name?: string;
      age?: number;
      language?: string;
    },
  ) {
    return this.usersService.create(body);
  }
}
