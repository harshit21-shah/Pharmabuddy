// backend/src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Register User entity for this module
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export so other modules can use it
})
export class UsersModule {}
