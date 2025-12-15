// backend/src/main.ts
// This file starts our NestJS application

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Enable CORS (allows frontend to talk to backend)
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-url.vercel.app'],
    credentials: true,
  });

  // Global validation (automatically validates incoming data)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove unknown properties
      forbidNonWhitelisted: true, // Throw error if unknown properties
      transform: true, // Auto-convert types (string "5" -> number 5)
    }),
  );

  // Set global prefix for all routes (optional)
  // Example: /api/users instead of /users
  app.setGlobalPrefix('api', {
    exclude: ['/'], // Root path excluded from prefix
  });

  // Get port from environment variable or use 3001
  const port = process.env.PORT || 3001;

  // Start server
  await app.listen(port);

  console.log(`
  🚀 Server is running on: http://localhost:${port}
  📖 API Documentation: http://localhost:${port}/api
  `);
}

// Run the application
void bootstrap();
