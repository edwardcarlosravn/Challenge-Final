import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../../services/users.service';

import { OtpModule } from '../opt/opt.module';
import { EmailModule } from '../mails/mails.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule, OtpModule, EmailModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
