import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from '../../database/entities/medicine.entity';

@Injectable()
export class MedicinesService {
    private readonly logger = new Logger(MedicinesService.name);

    constructor(
        @InjectRepository(Medicine)
        private medicineRepo: Repository<Medicine>,
    ) { }

    async create(data: Partial<Medicine>): Promise<Medicine> {
        const medicine = this.medicineRepo.create(data);
        return this.medicineRepo.save(medicine);
    }

    async findAll(userId: string): Promise<Medicine[]> {
        return this.medicineRepo.find({ where: { userId, isActive: true } });
    }

    async findOne(id: string): Promise<Medicine | null> {
        return this.medicineRepo.findOneBy({ id });
    }
    async updateStock(id: string, quantity: number): Promise<Medicine> {
        const medicine = await this.findOne(id);
        if (!medicine) {
            throw new Error('Medicine not found');
        }
        medicine.stockQuantity = quantity;
        return this.medicineRepo.save(medicine);
    }
}
