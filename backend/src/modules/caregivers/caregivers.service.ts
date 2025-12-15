import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caregiver } from '../../database/entities/caregiver.entity';

@Injectable()
export class CaregiversService {
    private readonly logger = new Logger(CaregiversService.name);

    constructor(
        @InjectRepository(Caregiver)
        private caregiverRepo: Repository<Caregiver>,
    ) { }

    async create(data: {
        userId: string;
        name: string;
        phoneNumber: string;
        relationship?: string;
    }): Promise<Caregiver> {
        const caregiver = this.caregiverRepo.create({
            userId: data.userId,
            name: data.name,
            phoneNumber: data.phoneNumber,
            relationship: data.relationship,
            shouldNotify: true,
        });

        const saved = await this.caregiverRepo.save(caregiver);
        this.logger.log(`✅ Caregiver added: ${saved.name} for user ${data.userId}`);
        return saved;
    }

    async findAllByUserId(userId: string): Promise<Caregiver[]> {
        return this.caregiverRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async delete(id: string): Promise<void> {
        await this.caregiverRepo.delete(id);
        this.logger.log(`🗑️ Caregiver deleted: ${id}`);
    }
}
