import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { OTPType } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class OTPService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(user: User, type: OTPType): Promise<string> {
    if (type === OTPType.otp) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
      try {
        await this.prismaService.oTP.upsert({
          where: { userId_type: { userId: user.id, type: type } },
          update: {
            token: hashedOTP,
            expiresAt,
          },
          create: {
            userId: user.id,
            token: hashedOTP,
            type,
            expiresAt,
          },
        });
      } catch (error) {
        console.error('Error upserting OTP:', error);
        throw new InternalServerErrorException('Could not generate OTP.');
      }
      return otp;
    } else if (type === OTPType.reset_password) {
      const resetToken = this.jwtService.sign(
        { id: user.id, email: user.email },
        {
          secret: this.configService.getOrThrow<string>('JWT_RESET_SECRET'),
          expiresIn: '15m',
        },
      );
      return resetToken;
    }
    throw new BadRequestException('Invalid OTP type specified.');
  }

  async validateOTP(userId: number, otpAttempt: string): Promise<boolean> {
    const storedOtp = await this.prismaService.oTP.findFirst({
      where: {
        userId: userId,
        type: OTPType.otp,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!storedOtp) {
      throw new BadRequestException(
        'OTP is expired or invalid. Please request a new one.',
      );
    }

    const isMatch = await bcrypt.compare(otpAttempt, storedOtp.token);

    if (!isMatch) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    return true;
  }

  validateResetPassword(token: string) {
    try {
      const decoded = this.jwtService.verify<{ id: number }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_RESET_SECRET'),
      });
      return decoded.id;
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'The reset token has expired. Please request a new one.',
        );
      }
      console.error('Invalid reset token:', error);
      throw new BadRequestException('Invalid or malformed reset token.');
    }
  }
}
