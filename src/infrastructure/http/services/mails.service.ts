import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from '../dto/mails/email.dto';
import { OTPService } from './opt.service';
import { OTPType, User } from '@prisma/client';

interface EmailData {
  recipients: string[];
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OTPService,
  ) {}

  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    return transporter;
  }

  async sendEmail(dto: sendEmailDto) {
    const { recipients, subject, html } = dto;

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: recipients,
      subject: subject,
      html: html,
    };

    try {
      await transport.sendMail(options);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException('Failed to send email');
      }
    }
  }

  async sendVerificationEmail(user: User, type: OTPType): Promise<void> {
    try {
      const token = await this.otpService.generateToken(user, type);
      const emailDto = this.buildEmailData(user.email, token, type);
      await this.sendEmail(emailDto);
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to send ${type.replace('_', ' ')} email`,
        );
      }
    }
  }

  private buildEmailData(
    email: string,
    token: string,
    type: OTPType,
  ): EmailData {
    switch (type) {
      case OTPType.otp:
        return this.buildOTPEmail(email, token);

      case OTPType.reset_password:
        return this.buildResetPasswordEmail(email, token);

      default:
        throw new Error(`Unsupported email type: ${String(type)}`);
    }
  }

  private buildOTPEmail(email: string, token: string): EmailData {
    return {
      recipients: [email],
      subject: 'OTP for verification',
      html: `Your otp code is: <strong>${token}</strong>.<br />Provide this otp to verify your account`,
    };
  }

  private buildResetPasswordEmail(email: string, token: string): EmailData {
    const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
    return {
      recipients: [email],
      subject: 'Password Reset Link',
      html: `Click the link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
    };
  }
}
