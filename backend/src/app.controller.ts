import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello() {
    return {
      name: 'PharmaBuddy API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        users: '/api/users',
        medicines: '/api/medicines',
        reminders: '/api/reminders',
        caregivers: '/api/caregivers',
        whatsapp: '/api/whatsapp/webhook',
        voice: '/api/voice/webhook',
      },
      docs: 'Visit /api for API overview',
    };
  }
}
