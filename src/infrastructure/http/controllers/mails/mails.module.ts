import { Module } from '@nestjs/common';
import { EmailController } from './mails.controller';
import { EmailService } from '../../services/mails.service';
import { ConfigModule } from '@nestjs/config';
import { OtpModule } from '../opt/opt.module';

@Module({
  imports: [ConfigModule, OtpModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
