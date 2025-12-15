import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { MedicinesService } from './medicines.service';

@Controller('medicines')
export class MedicinesController {
    constructor(private readonly medicinesService: MedicinesService) { }

    @Post()
    async create(@Body() body: any) {
        return this.medicinesService.create(body);
    }

    @Get()
    async findAll(@Query('userId') userId: string) {
        return this.medicinesService.findAll(userId);
    }
    @Patch(':id/stock')
    async updateStock(
        @Param('id') id: string,
        @Body('quantity') quantity: number
    ) {
        return this.medicinesService.updateStock(id, quantity);
    }
}
