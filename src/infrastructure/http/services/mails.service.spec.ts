import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailService } from './mails.service';
import { OTPService } from './opt.service';
import { sendEmailDto } from '../dto/mails/email.dto';
import { OTPType, User } from '@prisma/client';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let otpService: jest.Mocked<OTPService>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  // Reusable test data
  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    hashedRefreshToken: null,
    role: 'CLIENT' as any,
    accountStatus: 'VERIFIED' as any,
    phone: '1234567890',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  const mockEmailDto: sendEmailDto = {
    recipients: ['test@example.com'],
    subject: 'Test Subject',
    html: '<p>Test HTML content</p>',
  };

  const mockEmailConfig = {
    EMAIL_HOST: 'smtp.example.com',
    EMAIL_PORT: 587,
    EMAIL_USER: 'noreply@example.com',
    EMAIL_PASSWORD: 'password123',
    RESET_PASSWORD_URL: 'https://example.com/reset-password',
  };

  const mockOTPToken = '123456';

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
    } as unknown as jest.Mocked<nodemailer.Transporter>;

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn(
        (key: string) => mockEmailConfig[key as keyof typeof mockEmailConfig],
      ),
    };

    // Mock OTPService
    const mockOTPService = {
      generateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OTPService,
          useValue: mockOTPService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
    otpService = module.get(OTPService);

    // Mock nodemailer.createTransport
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emailTransport', () => {
    it('should create and return a nodemailer transporter with correct configuration', () => {
      const result = service.emailTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: mockEmailConfig.EMAIL_HOST,
        port: mockEmailConfig.EMAIL_PORT,
        secure: false,
        auth: {
          user: mockEmailConfig.EMAIL_USER,
          pass: mockEmailConfig.EMAIL_PASSWORD,
        },
      });

      expect(result).toBe(mockTransporter);
    });

    it('should create transporter with different configuration values', () => {
      const altConfig = {
        EMAIL_HOST: 'smtp.gmail.com',
        EMAIL_PORT: 465,
        EMAIL_USER: 'test@gmail.com',
        EMAIL_PASSWORD: 'app-password',
      };

      configService.get.mockImplementation(
        (key: string) => altConfig[key as keyof typeof altConfig],
      );

      service.emailTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: altConfig.EMAIL_HOST,
        port: altConfig.EMAIL_PORT,
        secure: false,
        auth: {
          user: altConfig.EMAIL_USER,
          pass: altConfig.EMAIL_PASSWORD,
        },
      });
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      jest.spyOn(service, 'emailTransport').mockReturnValue(mockTransporter);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send email successfully with correct options', async () => {
      mockTransporter.sendMail.mockResolvedValue({} as any);

      await service.sendEmail(mockEmailDto);

      expect(service.emailTransport).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockEmailConfig.EMAIL_USER,
        to: mockEmailDto.recipients,
        subject: mockEmailDto.subject,
        html: mockEmailDto.html,
      });
    });

    it('should handle multiple recipients', async () => {
      const multiRecipientDto: sendEmailDto = {
        ...mockEmailDto,
        recipients: [
          'user1@example.com',
          'user2@example.com',
          'user3@example.com',
        ],
      };
      mockTransporter.sendMail.mockResolvedValue({} as any);

      await service.sendEmail(multiRecipientDto);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockEmailConfig.EMAIL_USER,
        to: multiRecipientDto.recipients,
        subject: multiRecipientDto.subject,
        html: multiRecipientDto.html,
      });
    });

    it('should throw InternalServerErrorException when sending fails', async () => {
      const mockError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(mockError);

      await expect(service.sendEmail(mockEmailDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.sendEmail(mockEmailDto)).rejects.toThrow(
        'Failed to send email',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for network timeout errors', async () => {
      const timeoutError = new Error('ETIMEDOUT');
      mockTransporter.sendMail.mockRejectedValue(timeoutError);

      await expect(service.sendEmail(mockEmailDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for authentication errors', async () => {
      const authError = new Error('Invalid login: 535 Authentication failed');
      mockTransporter.sendMail.mockRejectedValue(authError);

      await expect(service.sendEmail(mockEmailDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('sendVerificationEmail', () => {
    beforeEach(() => {
      jest.spyOn(service, 'sendEmail').mockResolvedValue();
      otpService.generateToken.mockResolvedValue(mockOTPToken);
    });

    it('should send OTP verification email successfully', async () => {
      await service.sendVerificationEmail(mockUser, OTPType.otp);

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.otp,
      );
      expect(service.sendEmail).toHaveBeenCalledWith({
        recipients: [mockUser.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${mockOTPToken}</strong>.<br />Provide this otp to verify your account`,
      });
    });

    it('should send reset password email successfully', async () => {
      await service.sendVerificationEmail(mockUser, OTPType.reset_password);

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.reset_password,
      );
      expect(service.sendEmail).toHaveBeenCalledWith({
        recipients: [mockUser.email],
        subject: 'Password Reset Link',
        html: `Click the link to reset your password: <p><a href="${mockEmailConfig.RESET_PASSWORD_URL}?token=${mockOTPToken}">Reset Password</a></p>`,
      });
    });

    it('should throw InternalServerErrorException when token generation fails', async () => {
      const tokenError = new Error('Failed to generate token');
      otpService.generateToken.mockRejectedValue(tokenError);

      await expect(
        service.sendVerificationEmail(mockUser, OTPType.otp),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.sendVerificationEmail(mockUser, OTPType.otp),
      ).rejects.toThrow('Failed to send otp email');

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.otp,
      );
      expect(service.sendEmail).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when email sending fails', async () => {
      const emailError = new Error('Failed to send email');
      jest.spyOn(service, 'sendEmail').mockRejectedValue(emailError);

      await expect(
        service.sendVerificationEmail(mockUser, OTPType.otp),
      ).rejects.toThrow(InternalServerErrorException);

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.otp,
      );
      expect(service.sendEmail).toHaveBeenCalledWith({
        recipients: [mockUser.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${mockOTPToken}</strong>.<br />Provide this otp to verify your account`,
      });
    });

    it('should throw InternalServerErrorException for reset password email failure', async () => {
      const tokenError = new Error('Token generation failed');
      otpService.generateToken.mockRejectedValue(tokenError);

      await expect(
        service.sendVerificationEmail(mockUser, OTPType.reset_password),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.sendVerificationEmail(mockUser, OTPType.reset_password),
      ).rejects.toThrow('Failed to send reset password email');

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.reset_password,
      );
    });

    it('should handle different user email formats', async () => {
      const userWithDifferentEmail = {
        ...mockUser,
        email: 'user.name+tag@domain.co.uk',
      };

      await service.sendVerificationEmail(userWithDifferentEmail, OTPType.otp);

      expect(service.sendEmail).toHaveBeenCalledWith({
        recipients: [userWithDifferentEmail.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${mockOTPToken}</strong>.<br />Provide this otp to verify your account`,
      });
    });
  });

  describe('buildEmailData', () => {
    it('should build OTP email data correctly', () => {
      const result = (service as any).buildEmailData(
        'test@example.com',
        '123456',
        OTPType.otp,
      );

      expect(result).toEqual({
        recipients: ['test@example.com'],
        subject: 'OTP for verification',
        html: 'Your otp code is: <strong>123456</strong>.<br />Provide this otp to verify your account',
      });
    });

    it('should build reset password email data correctly', () => {
      const result = (service as any).buildEmailData(
        'test@example.com',
        'reset-token',
        OTPType.reset_password,
      );

      expect(result).toEqual({
        recipients: ['test@example.com'],
        subject: 'Password Reset Link',
        html: `Click the link to reset your password: <p><a href="${mockEmailConfig.RESET_PASSWORD_URL}?token=reset-token">Reset Password</a></p>`,
      });
    });

    it('should throw error for unsupported email type', () => {
      expect(() => {
        (service as any).buildEmailData(
          'test@example.com',
          'token',
          'invalid_type' as OTPType,
        );
      }).toThrow('Unsupported email type: invalid_type');
    });
  });

  describe('buildOTPEmail', () => {
    it('should build OTP email with correct format', () => {
      const result = (service as any).buildOTPEmail('user@test.com', '654321');

      expect(result).toEqual({
        recipients: ['user@test.com'],
        subject: 'OTP for verification',
        html: 'Your otp code is: <strong>654321</strong>.<br />Provide this otp to verify your account',
      });
    });

    it('should handle special characters in token', () => {
      const result = (service as any).buildOTPEmail(
        'user@test.com',
        'ABC123!@#',
      );

      expect(result.html).toContain('<strong>ABC123!@#</strong>');
    });
  });

  describe('buildResetPasswordEmail', () => {
    it('should build reset password email with correct format', () => {
      const result = (service as any).buildResetPasswordEmail(
        'user@test.com',
        'reset-token-123',
      );

      expect(result).toEqual({
        recipients: ['user@test.com'],
        subject: 'Password Reset Link',
        html: `Click the link to reset your password: <p><a href="${mockEmailConfig.RESET_PASSWORD_URL}?token=reset-token-123">Reset Password</a></p>`,
      });
    });

    it('should handle missing RESET_PASSWORD_URL configuration', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'RESET_PASSWORD_URL'
          ? undefined
          : mockEmailConfig[key as keyof typeof mockEmailConfig],
      );

      const result = (service as any).buildResetPasswordEmail(
        'user@test.com',
        'token',
      );

      expect(result.html).toContain('undefined?token=token');
    });

    it('should handle special characters in reset token', () => {
      const result = (service as any).buildResetPasswordEmail(
        'user@test.com',
        'token-with-special@chars&test',
      );

      expect(result.html).toContain('token-with-special@chars&test');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete OTP verification email flow', async () => {
      jest.spyOn(service, 'emailTransport').mockReturnValue(mockTransporter);
      mockTransporter.sendMail.mockResolvedValue({} as any);
      otpService.generateToken.mockResolvedValue(mockOTPToken);

      await service.sendVerificationEmail(mockUser, OTPType.otp);

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.otp,
      );
      expect(service.emailTransport).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockEmailConfig.EMAIL_USER,
        to: [mockUser.email],
        subject: 'OTP for verification',
        html: `Your otp code is: <strong>${mockOTPToken}</strong>.<br />Provide this otp to verify your account`,
      });
    });

    it('should handle complete password reset email flow', async () => {
      jest.spyOn(service, 'emailTransport').mockReturnValue(mockTransporter);
      mockTransporter.sendMail.mockResolvedValue({} as any);
      otpService.generateToken.mockResolvedValue('reset-token-abc');

      await service.sendVerificationEmail(mockUser, OTPType.reset_password);

      expect(otpService.generateToken).toHaveBeenCalledWith(
        mockUser,
        OTPType.reset_password,
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockEmailConfig.EMAIL_USER,
        to: [mockUser.email],
        subject: 'Password Reset Link',
        html: `Click the link to reset your password: <p><a href="${mockEmailConfig.RESET_PASSWORD_URL}?token=reset-token-abc">Reset Password</a></p>`,
      });
    });

    it('should handle email service end-to-end with real transporter configuration', () => {
      const realTransporter = service.emailTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: mockEmailConfig.EMAIL_HOST,
        port: mockEmailConfig.EMAIL_PORT,
        secure: false,
        auth: {
          user: mockEmailConfig.EMAIL_USER,
          pass: mockEmailConfig.EMAIL_PASSWORD,
        },
      });

      expect(realTransporter).toBeDefined();
    });

    it('should properly format emails for different locales', async () => {
      const userWithInternationalChars = {
        ...mockUser,
        email: 'üser@tést.com',
      };

      otpService.generateToken.mockResolvedValue('测试123');
      jest.spyOn(service, 'sendEmail').mockResolvedValue();

      await service.sendVerificationEmail(
        userWithInternationalChars,
        OTPType.otp,
      );

      expect(service.sendEmail).toHaveBeenCalledWith({
        recipients: ['üser@tést.com'],
        subject: 'OTP for verification',
        html: 'Your otp code is: <strong>测试123</strong>.<br />Provide this otp to verify your account',
      });
    });

    it('should handle GlobalExceptionFilter integration', async () => {
      const databaseError = new Error('Database connection lost');
      otpService.generateToken.mockRejectedValue(databaseError);

      try {
        await service.sendVerificationEmail(mockUser, OTPType.otp);
        fail('Expected InternalServerErrorException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Failed to send otp email');
      }
    });

    it('should handle SMTP server errors appropriately', async () => {
      const smtpError = new Error('SMTP server temporarily unavailable');
      jest.spyOn(service, 'emailTransport').mockReturnValue(mockTransporter);
      mockTransporter.sendMail.mockRejectedValue(smtpError);

      try {
        await service.sendEmail(mockEmailDto);
        fail('Expected InternalServerErrorException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Failed to send email');
      }
    });
  });
});
