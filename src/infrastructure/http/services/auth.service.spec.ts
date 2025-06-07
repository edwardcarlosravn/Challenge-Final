/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { OTPService } from './opt.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { AccountStatus, OTP, OTPType, Role, User } from '@prisma/client';
import refreshJwtConfig from '../controllers/auth/config/refresh-jwt.config';

jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let otpService: OTPService;
  let prismaService: PrismaService;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    first_name: 'John',
    last_name: 'Doe',
    phone: '1234567890',
    role: Role.CLIENT,
    accountStatus: AccountStatus.VERIFIED,
    hashedRefreshToken: 'oldHashedRefreshToken',
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    deleted_at: null,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            updateHashedRefreshToken: jest.fn(),
            getUser: jest.fn(),
            updateAccountStatus: jest.fn(),
            findByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: OTPService,
          useValue: {
            validateOTP: jest.fn(),
            validateResetPassword: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { update: jest.fn() },
            oTP: { findFirst: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn() },
        },
        {
          provide: refreshJwtConfig.KEY,
          useValue: { secret: 'refresh-secret', expiresIn: '7d' },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    otpService = module.get<OTPService>(OTPService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('refreshToken', () => {
    it('should generate new tokens and update refresh token hash', async () => {
      const mockUser = createMockUser();
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };
      const expectedHashedRefreshToken = 'newHashedRefreshToken';

      jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
      mockedArgon2.hash.mockResolvedValue(expectedHashedRefreshToken);
      jest.spyOn(usersService, 'updateHashedRefreshToken').mockResolvedValue({
        ...mockUser,
        hashedRefreshToken: expectedHashedRefreshToken,
      });

      const result = await service.refreshToken(mockUser);

      expect(service.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockedArgon2.hash).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith(
        { id: mockUser.id },
        expectedHashedRefreshToken,
      );
      expect(result).toEqual({
        id: mockUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });

  describe('login', () => {
    it('should login verified user successfully', async () => {
      const mockVerifiedUser = createMockUser({
        accountStatus: AccountStatus.VERIFIED,
      });
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };
      const expectedHashedRefreshToken = 'newHashedRefreshToken';

      jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
      mockedArgon2.hash.mockResolvedValue(expectedHashedRefreshToken);
      jest.spyOn(usersService, 'updateHashedRefreshToken').mockResolvedValue({
        ...mockVerifiedUser,
        hashedRefreshToken: expectedHashedRefreshToken,
      });

      const result = await service.login(mockVerifiedUser);

      expect(service.generateTokens).toHaveBeenCalledWith(mockVerifiedUser);
      expect(result).toEqual({
        id: mockVerifiedUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should login unverified user with valid OTP', async () => {
      const mockUnverifiedUser = createMockUser({
        id: 2,
        accountStatus: AccountStatus.UNVERIFIED,
      });
      const validOtp = '123456';
      const verifiedUser = {
        ...mockUnverifiedUser,
        accountStatus: AccountStatus.VERIFIED,
      };
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(verifiedUser);
      jest.spyOn(usersService, 'getUser').mockResolvedValue(verifiedUser);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
      mockedArgon2.hash.mockResolvedValue('hashedRefreshToken');
      jest
        .spyOn(usersService, 'updateHashedRefreshToken')
        .mockResolvedValue(verifiedUser);

      const result = await service.login(mockUnverifiedUser, validOtp);

      expect(service.verifyToken).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        validOtp,
      );
      expect(usersService.getUser).toHaveBeenCalledWith({
        id: mockUnverifiedUser.id,
      });
      expect(service.generateTokens).toHaveBeenCalledWith(verifiedUser);
      expect(result).toEqual({
        id: verifiedUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should return message when unverified user provides invalid OTP', async () => {
      const mockUnverifiedUser = createMockUser({
        accountStatus: AccountStatus.UNVERIFIED,
      });

      const invalidOtpCases = [undefined, '', '   '];

      for (const invalidOtp of invalidOtpCases) {
        jest.clearAllMocks();

        const result = await service.login(mockUnverifiedUser, invalidOtp);

        const expectedMessage =
          invalidOtp === undefined
            ? 'Your account is not verified.Please provide your otp to verify.'
            : invalidOtp === ''
              ? 'Your account is not verified.Please provide your otp to verify.'
              : 'OTP is required for unverified accounts.';

        expect(result).toEqual({ message: expectedMessage });
        expect(usersService.updateHashedRefreshToken).not.toHaveBeenCalled();
      }
    });

    it('should handle error during OTP verification', async () => {
      const mockUnverifiedUser = createMockUser({
        accountStatus: AccountStatus.UNVERIFIED,
      });
      const invalidOtp = '000000';
      const verificationError = new Error('Invalid OTP provided');

      jest.spyOn(service, 'verifyToken').mockRejectedValue(verificationError);

      await expect(
        service.login(mockUnverifiedUser, invalidOtp),
      ).rejects.toThrow('Invalid OTP provided');

      expect(service.verifyToken).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        invalidOtp,
      );
      expect(usersService.getUser).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify OTP and update user status to VERIFIED', async () => {
      const mockUnverifiedUser = createMockUser({
        id: 3,
        accountStatus: AccountStatus.UNVERIFIED,
      });
      const mockVerifiedUser = {
        ...mockUnverifiedUser,
        accountStatus: AccountStatus.VERIFIED,
      };
      const validOtp = '123456';

      jest.spyOn(otpService, 'validateOTP').mockResolvedValue(true);
      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUnverifiedUser);
      jest
        .spyOn(usersService, 'updateAccountStatus')
        .mockResolvedValue(mockVerifiedUser);

      const result = await service.verifyToken(mockUnverifiedUser.id, validOtp);

      expect(otpService.validateOTP).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        validOtp,
      );
      expect(usersService.getUser).toHaveBeenCalledWith({
        id: mockUnverifiedUser.id,
      });
      expect(usersService.updateAccountStatus).toHaveBeenCalledWith(
        mockUnverifiedUser.id,
        AccountStatus.VERIFIED,
      );
      expect(result).toEqual(mockVerifiedUser);
    });

    it('should handle invalid OTP during verification', async () => {
      const userId = 3;
      const invalidOtp = '000000';
      const otpError = new Error('Invalid OTP. Please try again.');

      jest.spyOn(otpService, 'validateOTP').mockRejectedValue(otpError);

      await expect(service.verifyToken(userId, invalidOtp)).rejects.toThrow(
        'Invalid OTP. Please try again.',
      );

      expect(otpService.validateOTP).toHaveBeenCalledWith(userId, invalidOtp);
      expect(usersService.getUser).not.toHaveBeenCalled();
      expect(usersService.updateAccountStatus).not.toHaveBeenCalled();
    });

    it('should handle user not found during verification', async () => {
      const userId = 3;
      const validOtp = '123456';
      const userNotFoundError = new Error('User not found');

      jest.spyOn(otpService, 'validateOTP').mockResolvedValue(true);
      jest.spyOn(usersService, 'getUser').mockRejectedValue(userNotFoundError);

      await expect(service.verifyToken(userId, validOtp)).rejects.toThrow(
        'User not found',
      );

      expect(otpService.validateOTP).toHaveBeenCalledWith(userId, validOtp);
      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(usersService.updateAccountStatus).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      const validToken = 'validResetToken';
      const newPassword = 'NewPassword123!';
      const hashedNewPassword = 'hashedNewPassword';
      const mockUser = createMockUser();
      const userId = mockUser.id;

      jest.spyOn(otpService, 'validateResetPassword').mockReturnValue(userId);
      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      mockedArgon2.hash.mockResolvedValue(hashedNewPassword);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        password: hashedNewPassword,
      });

      const result = await service.resetPassword(validToken, newPassword);

      expect(otpService.validateResetPassword).toHaveBeenCalledWith(validToken);
      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.hash).toHaveBeenCalledWith(newPassword);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should handle invalid reset token', async () => {
      const invalidToken = 'invalidToken';
      const newPassword = 'NewPassword123!';
      const tokenError = new BadRequestException(
        'Invalid or malformed reset token.',
      );

      jest.spyOn(otpService, 'validateResetPassword').mockImplementation(() => {
        throw tokenError;
      });

      await expect(
        service.resetPassword(invalidToken, newPassword),
      ).rejects.toThrow(tokenError);

      expect(otpService.validateResetPassword).toHaveBeenCalledWith(
        invalidToken,
      );
      expect(usersService.getUser).not.toHaveBeenCalled();
      expect(mockedArgon2.hash).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw error when user not found for password reset', async () => {
      const validToken = 'validResetToken';
      const newPassword = 'NewPassword123!';
      const userId = 999;
      const userNotFoundError = new Error('User not found');

      jest.spyOn(otpService, 'validateResetPassword').mockReturnValue(userId);
      jest.spyOn(usersService, 'getUser').mockRejectedValue(userNotFoundError);

      await expect(
        service.resetPassword(validToken, newPassword),
      ).rejects.toThrow('User not found');

      expect(otpService.validateResetPassword).toHaveBeenCalledWith(validToken);
      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.hash).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockUser = createMockUser();
      const jwtService = module.get<JwtService>(JwtService);
      const configService = module.get<ConfigService>(ConfigService);
      const expectedTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      jest.spyOn(configService, 'getOrThrow').mockReturnValue('1h');
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(expectedTokens.accessToken)
        .mockResolvedValueOnce(expectedTokens.refreshToken);

      const result = await service.generateTokens(mockUser);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { userId: mockUser.id },
        {
          expiresIn: '1h',
        },
      );
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { userId: mockUser.id },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );
      expect(result).toEqual(expectedTokens);
    });
  });

  describe('verifyUser', () => {
    it('should verify user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'correctPassword';
      const mockUser = createMockUser({
        email: email,
        password: 'hashedCorrectPassword',
      });
      const { password: _, ...expectedResult } = mockUser;

      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(true);

      const result = await service.verifyUser(email, password);

      expect(usersService.getUser).toHaveBeenCalledWith({ email });
      expect(mockedArgon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        password,
      );
      expect(result).toEqual(expectedResult);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const email = 'test@example.com';
      const wrongPassword = 'wrongPassword';
      const mockUser = createMockUser({
        email,
        password: 'hashedCorrectPassword',
      });

      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(service.verifyUser(email, wrongPassword)).rejects.toThrow(
        'Credentials are not valid',
      );

      expect(usersService.getUser).toHaveBeenCalledWith({ email });
      expect(mockedArgon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        wrongPassword,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const nonExistentEmail = 'nonexistent@example.com';
      const password = 'password';
      const userNotFoundError = new Error('User not found');

      jest.spyOn(usersService, 'getUser').mockRejectedValue(userNotFoundError);

      await expect(
        service.verifyUser(nonExistentEmail, password),
      ).rejects.toThrow('Credentials are not valid');

      expect(usersService.getUser).toHaveBeenCalledWith({
        email: nonExistentEmail,
      });
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token successfully', async () => {
      const userId = 1;
      const validRefreshToken = 'validRefreshToken';
      const mockUser = createMockUser({
        id: userId,
        hashedRefreshToken: 'hashedValidRefreshToken',
      });

      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(true);

      const result = await service.validateRefreshToken(
        userId,
        validRefreshToken,
      );

      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.verify).toHaveBeenCalledWith(
        mockUser.hashedRefreshToken,
        validRefreshToken,
      );
      expect(result).toEqual({ id: userId });
    });

    it('should throw UnauthorizedException when tokens do not match', async () => {
      const userId = 1;
      const invalidRefreshToken = 'invalidRefreshToken';
      const mockUser = createMockUser({
        id: userId,
        hashedRefreshToken: 'hashedValidRefreshToken',
      });

      jest.spyOn(usersService, 'getUser').mockResolvedValue(mockUser);
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(
        service.validateRefreshToken(userId, invalidRefreshToken),
      ).rejects.toThrow('Invalid refresh Token');

      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.verify).toHaveBeenCalledWith(
        mockUser.hashedRefreshToken,
        invalidRefreshToken,
      );
    });

    it('should throw UnauthorizedException when user has no hashed refresh token', async () => {
      const userId = 1;
      const validRefreshToken = 'validRefreshToken';
      const userWithoutRefreshToken = createMockUser({
        id: userId,
        hashedRefreshToken: null,
      });

      jest
        .spyOn(usersService, 'getUser')
        .mockResolvedValue(userWithoutRefreshToken);

      await expect(
        service.validateRefreshToken(userId, validRefreshToken),
      ).rejects.toThrow('Invalid refresh Token');

      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });

    it('should throw error when user not found for refresh token validation', async () => {
      const userId = 1;
      const validRefreshToken = 'validRefreshToken';
      const userNotFoundError = new Error('User not found');

      jest.spyOn(usersService, 'getUser').mockRejectedValue(userNotFoundError);

      await expect(
        service.validateRefreshToken(userId, validRefreshToken),
      ).rejects.toThrow('User not found');

      expect(usersService.getUser).toHaveBeenCalledWith({ id: userId });
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should signout user successfully by clearing refresh token', async () => {
      const userId = 1;
      const updatedUser = createMockUser({
        id: userId,
        hashedRefreshToken: null,
      });

      jest
        .spyOn(usersService, 'updateHashedRefreshToken')
        .mockResolvedValue(updatedUser);

      await service.signOut(userId);

      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith(
        { id: userId },
        null,
      );
    });
  });

  describe('signUp', () => {
    it('should create user successfully', async () => {
      const mockCreateUserRequest = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        first_name: 'New',
        last_name: 'User',
        phone: '0987654321',
      };
      const createdUser = createMockUser({
        email: mockCreateUserRequest.email,
        first_name: mockCreateUserRequest.first_name,
        last_name: mockCreateUserRequest.last_name,
        phone: mockCreateUserRequest.phone,
        accountStatus: AccountStatus.UNVERIFIED,
      });

      jest.spyOn(usersService, 'createUser').mockResolvedValue(createdUser);

      const result = await service.signUp(mockCreateUserRequest);

      expect(usersService.createUser).toHaveBeenCalledWith(
        mockCreateUserRequest,
      );
      expect(result).toEqual(createdUser);
    });
  });

  describe('findActiveOtpForUser', () => {
    it('should return active OTP for user with default type', async () => {
      const userId = 1;
      const mockOtp: OTP = {
        id: 1,
        userId: userId,
        token: 'hashedOtpToken',
        type: OTPType.otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.oTP, 'findFirst').mockResolvedValue(mockOtp);

      const result = await service.findActiveOtpForUser(userId);

      expect(prismaService.oTP.findFirst).toHaveBeenCalledWith({
        where: {
          userId: userId,
          type: OTPType.otp,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockOtp);
    });
  });

  describe('hasActiveOtp', () => {
    // ✅ NECESARIO - Wrapper method que agrega lógica boolean
    it('should return true when user has active OTP', async () => {
      const userId = 1;
      const mockOtp: OTP = {
        id: 1,
        userId: userId,
        token: 'hashedOtpToken',
        type: OTPType.otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };

      jest.spyOn(service, 'findActiveOtpForUser').mockResolvedValue(mockOtp);

      const result = await service.hasActiveOtp(userId);

      expect(service.findActiveOtpForUser).toHaveBeenCalledWith(
        userId,
        OTPType.otp,
      );
      expect(result).toBe(true);
    });
  });
});
