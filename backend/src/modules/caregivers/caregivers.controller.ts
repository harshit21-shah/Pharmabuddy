import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { CaregiversService } from './caregivers.service';

@Controller('caregivers')
export class CaregiversController {
    constructor(private readonly caregiversService: CaregiversService) { }

    @Post()
    async create(@Body() body: {
        userId: string;
        name: string;
        phoneNumber: string;
        relationship?: string;
    }) {
        return this.caregiversService.create(body);
    }

    @Get('user/:userId')
    async findAll(@Param('userId') userId: string) {
        return this.caregiversService.findAllByUserId(userId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.caregiversService.delete(id);
        return { message: 'Caregiver deleted' };
    }
}
