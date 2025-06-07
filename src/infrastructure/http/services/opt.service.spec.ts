import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OTPType, Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { OTPService } from './opt.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';

jest.mock('bcrypt');
jest.mock('crypto');

const mockBcrypt = bcrypt;

const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('OTPService', () => {
  let service: OTPService;

  let prismaService: any;

  let jwtService: any;

  let configService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    hashedRefreshToken: null,
    role: Role.CLIENT,
    accountStatus: AccountStatus.UNVERIFIED,
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockOTP = {
    id: 1,
    userId: 1,
    type: OTPType.otp,
    token: 'hashedOTP',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OTPService,
        {
          provide: PrismaService,
          useValue: {
            oTP: {
              upsert: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OTPService>(OTPService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    describe('OTP token generation', () => {
      it('should generate OTP token successfully', async () => {
        // Arrange
        const mockOTPCode = '123456';
        const mockHashedOTP = 'hashedOTP123';

        (mockCrypto.randomInt as any).mockReturnValue(123456);

        (mockBcrypt.hash as any).mockResolvedValue(mockHashedOTP);
        prismaService.oTP.upsert.mockResolvedValue(mockOTP);

        // Act
        const result = await service.generateToken(mockUser, OTPType.otp);

        // Assert
        expect(result).toBe(mockOTPCode);
        expect(mockCrypto.randomInt).toHaveBeenCalledWith(100000, 999999);
        expect(mockBcrypt.hash).toHaveBeenCalledWith(mockOTPCode, 10);
        expect(prismaService.oTP.upsert).toHaveBeenCalledWith({
          where: { userId_type: { userId: mockUser.id, type: OTPType.otp } },
          update: {
            token: mockHashedOTP,
            expiresAt: expect.any(Date),
          },
          create: {
            userId: mockUser.id,
            token: mockHashedOTP,
            type: OTPType.otp,
            expiresAt: expect.any(Date),
          },
        });
      });

      it('should create new OTP when none exists', async () => {
        // Arrange
        const mockOTPCode = '987654';
        const mockHashedOTP = 'hashedOTP987';

        (mockCrypto.randomInt as any).mockReturnValue(987654);

        (mockBcrypt.hash as any).mockResolvedValue(mockHashedOTP);
        prismaService.oTP.upsert.mockResolvedValue({
          ...mockOTP,
          token: mockHashedOTP,
        });

        // Act
        const result = await service.generateToken(mockUser, OTPType.otp);

        // Assert
        expect(result).toBe(mockOTPCode);
        expect(prismaService.oTP.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({
              userId: mockUser.id,
              token: mockHashedOTP,
              type: OTPType.otp,
            }),
          }),
        );
      });

      it('should throw InternalServerErrorException when database fails', async () => {
        // Arrange

        (mockCrypto.randomInt as any).mockReturnValue(123456);

        (mockBcrypt.hash as any).mockResolvedValue('hashedOTP');
        prismaService.oTP.upsert.mockRejectedValue(
          new Error('Database connection failed'),
        );

        // Act & Assert
        await expect(
          service.generateToken(mockUser, OTPType.otp),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.generateToken(mockUser, OTPType.otp),
        ).rejects.toThrow('Could not generate OTP.');
      });
    });

    describe('Reset password token generation', () => {
      it('should generate reset password token successfully', async () => {
        // Arrange
        const mockResetToken = 'jwt.reset.token';
        const mockSecret = 'reset-secret-key';

        configService.getOrThrow.mockReturnValue(mockSecret);
        jwtService.sign.mockReturnValue(mockResetToken);

        // Act
        const result = await service.generateToken(
          mockUser,
          OTPType.reset_password,
        );

        // Assert
        expect(result).toBe(mockResetToken);
        expect(configService.getOrThrow).toHaveBeenCalledWith(
          'JWT_RESET_SECRET',
        );
        expect(jwtService.sign).toHaveBeenCalledWith(
          { id: mockUser.id, email: mockUser.email },
          {
            secret: mockSecret,
            expiresIn: '15m',
          },
        );
      });
    });

    describe('Invalid OTP type', () => {
      it('should throw BadRequestException for invalid OTP type', async () => {
        // Act & Assert
        await expect(
          service.generateToken(mockUser, 'invalid_type' as OTPType),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.generateToken(mockUser, 'invalid_type' as OTPType),
        ).rejects.toThrow('Invalid OTP type specified.');
      });
    });
  });

  describe('validateOTP', () => {
    const userId = 1;
    const otpAttempt = '123456';

    it('should validate OTP successfully with correct code', async () => {
      // Arrange
      prismaService.oTP.findFirst.mockResolvedValue(mockOTP);

      (mockBcrypt.compare as any).mockResolvedValue(true);

      // Act
      const result = await service.validateOTP(userId, otpAttempt);

      // Assert
      expect(result).toBe(true);
      expect(prismaService.oTP.findFirst).toHaveBeenCalledWith({
        where: {
          userId: userId,
          type: OTPType.otp,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        otpAttempt,
        mockOTP.token,
      );
    });

    it('should throw BadRequestException for incorrect OTP', async () => {
      // Arrange
      prismaService.oTP.findFirst.mockResolvedValue(mockOTP);

      (mockBcrypt.compare as any).mockResolvedValue(false);

      // Act & Assert
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        'Invalid OTP. Please try again.',
      );
    });

    it('should throw BadRequestException for expired OTP', async () => {
      // Arrange
      prismaService.oTP.findFirst.mockResolvedValue(null); // No valid OTP found

      // Act & Assert
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        'OTP is expired or invalid. Please request a new one.',
      );
    });

    it('should throw BadRequestException when no OTP exists', async () => {
      // Arrange
      prismaService.oTP.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateOTP(userId, otpAttempt)).rejects.toThrow(
        'OTP is expired or invalid. Please request a new one.',
      );
    });
  });

  describe('validateResetPassword', () => {
    const mockToken = 'jwt.reset.token';
    const mockSecret = 'reset-secret-key';
    const mockDecodedPayload = { id: 1 };

    it('should validate reset password token successfully', () => {
      // Arrange
      configService.getOrThrow.mockReturnValue(mockSecret);
      jwtService.verify.mockReturnValue(mockDecodedPayload);

      // Act
      const result = service.validateResetPassword(mockToken);

      // Assert
      expect(result).toBe(mockDecodedPayload.id);
      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_RESET_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: mockSecret,
      });
    });

    it('should throw BadRequestException for expired token', () => {
      // Arrange
      configService.getOrThrow.mockReturnValue(mockSecret);
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw expiredError;
      });

      // Act & Assert
      expect(() => service.validateResetPassword(mockToken)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateResetPassword(mockToken)).toThrow(
        'The reset token has expired. Please request a new one.',
      );
    });

    it('should throw BadRequestException for invalid token', () => {
      // Arrange
      configService.getOrThrow.mockReturnValue(mockSecret);
      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwtService.verify.mockImplementation(() => {
        throw invalidError;
      });

      // Act & Assert
      expect(() => service.validateResetPassword(mockToken)).toThrow(
        BadRequestException,
      );
      expect(() => service.validateResetPassword(mockToken)).toThrow(
        'Invalid or malformed reset token.',
      );
    });

    it('should throw BadRequestException for malformed token', () => {
      // Arrange
      configService.getOrThrow.mockReturnValue(mockSecret);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Malformed JWT');
      });

      // Act & Assert
      expect(() => service.validateResetPassword('malformed.token')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateResetPassword('malformed.token')).toThrow(
        'Invalid or malformed reset token.',
      );
    });
  });
});
