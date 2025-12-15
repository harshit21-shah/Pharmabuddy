import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caregiver } from '../../database/entities/caregiver.entity';
import { CaregiversController } from './caregivers.controller';
import { CaregiversService } from './caregivers.service';

@Module({
    imports: [TypeOrmModule.forFeature([Caregiver])],
    controllers: [CaregiversController],
    providers: [CaregiversService],
    exports: [CaregiversService], // Export so Reminders module can use it if needed
})
export class CaregiversModule { }
