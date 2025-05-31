import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import refreshJwtConfig from './config/refresh-jwt.config';
import { OtpModule } from '../opt/opt.module';
import { EmailModule } from '../mails/mails.module';
import { LocalStrategy } from '../../strategies/auth/local.strategy';
import { JwtStrategy } from '../../strategies/auth/jwt.strategy';
import { RefreshJwtStrategy } from '../../strategies/auth/refresh.strategy';
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module';
import { UsersService } from '../../services/users.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    UsersModule,
    ConfigModule,
    ConfigModule.forFeature(refreshJwtConfig),
    OtpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    UsersService,
  ],
})
export class AuthModule {}
