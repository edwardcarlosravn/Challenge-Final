import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from '../dto/mails/email.dto';
import { OTPService } from './opt.service';
import { OTPType, User } from '@prisma/client';

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
      console.log('Email sent successfully');
    } catch (error) {
      console.log('Error sending mail: ', error);
    }
  }
  async sendVerificationEmail(user: User, type: OTPType): Promise<void> {
    const token = await this.otpService.generateToken(user, type);
    const emailStrategy = this.getEmailStrategy(type);
    const emailDto: EmailData = emailStrategy.getEmailData(user.email, token);

    await this.sendEmail(emailDto);
  }
  private getEmailStrategy(type: OTPType): EmailStrategy {
    const strategies = {
      [OTPType.otp]: new VerificationEmailStrategy(),
      [OTPType.reset_password]: new ResetPasswordEmailStrategy(
        this.configService,
      ),
    };

    const strategy = strategies[type];
    if (!strategy) {
      throw new Error('Invalid email strategy type');
    }
    return strategy;
  }
}
interface EmailData {
  recipients: string[];
  subject: string;
  html: string;
}

interface EmailStrategy {
  getEmailData(email: string, token: string): EmailData;
}

class VerificationEmailStrategy implements EmailStrategy {
  getEmailData(email: string, token: string) {
    return {
      recipients: [email],
      subject: 'OTP for verification',
      html: `Your otp code is: <strong>${token}</strong>.<br />Provide this otp to verify your account`,
    };
  }
}

class ResetPasswordEmailStrategy implements EmailStrategy {
  constructor(private readonly configService: ConfigService) {}

  getEmailData(email: string, token: string) {
    const resetLink = `${this.configService.get('RESET_PASSWORD_URL')}?token=${token}`;
    return {
      recipients: [email],
      subject: 'Password Reset Link',
      html: `Click the link to reset your password: <p><a href="${resetLink}">Reset Password</a></p>`,
    };
  }
}
