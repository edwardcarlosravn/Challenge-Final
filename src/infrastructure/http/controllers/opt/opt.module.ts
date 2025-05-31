import { Module } from '@nestjs/common';
import { OTPService } from '../../services/opt.service';

import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  providers: [OTPService],
  exports: [OTPService],
})
export class OtpModule {}
