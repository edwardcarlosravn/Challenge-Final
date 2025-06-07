import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { EmailService } from './mails.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { AccountStatus, OTPType, Role, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateUserRequest } from '../dto/user/create-user.request';

// Mock argon2
jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('UsersService', () => {
  let service: UsersService;
  let emailService: EmailService;
  let prismaService: PrismaService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    first_name: 'John',
    last_name: 'Doe',
    phone: '1234567890',
    role: Role.CLIENT,
    accountStatus: AccountStatus.VERIFIED,
    hashedRefreshToken: 'hashedRefreshToken',
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    deleted_at: null,
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: 2,
    role: Role.ADMIN,
    email: 'admin@example.com',
  };

  const mockCreateUserRequest: CreateUserRequest = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAccountStatus', () => {
    it('should update account status successfully', async () => {
      const updatedUser = {
        ...mockUser,
        accountStatus: AccountStatus.VERIFIED,
      };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateAccountStatus(
        1,
        AccountStatus.VERIFIED,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { accountStatus: AccountStatus.VERIFIED },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException for invalid account status', async () => {
      const invalidStatus = 'INVALID_STATUS' as AccountStatus;

      await expect(
        service.updateAccountStatus(1, invalidStatus),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockedArgon2.hash.mockResolvedValue('hashedPassword');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);
      (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.createUser(mockCreateUserRequest);

      expect(mockedArgon2.hash).toHaveBeenCalledWith('password123');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateUserRequest,
          password: 'hashedPassword',
        },
      });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser,
        OTPType.otp,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnprocessableEntityException for duplicate email', async () => {
      mockedArgon2.hash.mockResolvedValue('hashedPassword');
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      (prismaService.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(service.createUser(mockCreateUserRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should rethrow unknown errors', async () => {
      mockedArgon2.hash.mockResolvedValue('hashedPassword');
      const unknownError = new Error('Unknown error');
      (prismaService.user.create as jest.Mock).mockRejectedValue(unknownError);

      await expect(service.createUser(mockCreateUserRequest)).rejects.toThrow(
        unknownError,
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateHashedRefreshToken', () => {
    it('should update hashed refresh token', async () => {
      const updatedUser = { ...mockUser, hashedRefreshToken: 'newHashedToken' };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateHashedRefreshToken(
        { id: 1 },
        'newHashedToken',
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hashedRefreshToken: 'newHashedToken' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should set refresh token to null', async () => {
      const updatedUser = { ...mockUser, hashedRefreshToken: null };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateHashedRefreshToken({ id: 1 }, null);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hashedRefreshToken: null },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getUser', () => {
    it('should get user by filter', async () => {
      (prismaService.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        mockUser,
      );

      const result = await service.getUser({ id: 1 });

      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      const error = new Error('User not found');
      (prismaService.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(service.getUser({ id: 999 })).rejects.toThrow(error);
    });
  });

  describe('updateUserRole', () => {
    const targetUser = {
      ...mockUser,
      id: 3,
      role: Role.CLIENT,
      email: 'target@example.com',
    };

    const updatedUserResponse = {
      id: 3,
      email: 'target@example.com',
      role: Role.ADMIN,
      accountStatus: AccountStatus.VERIFIED,
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    it('should update user role successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        targetUser,
      );
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        updatedUserResponse,
      );

      const result = await service.updateUserRole(mockAdminUser, 3, Role.ADMIN);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { role: Role.ADMIN },
        select: {
          id: true,
          email: true,
          role: true,
          accountStatus: true,
          first_name: true,
          last_name: true,
          phone: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
        },
      });
      expect(result).toEqual(updatedUserResponse);
    });

    it('should throw ForbiddenException when admin tries to change own role', async () => {
      await expect(
        service.updateUserRole(mockAdminUser, mockAdminUser.id, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when target user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUserRole(mockAdminUser, 999, Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when trying to change another admin role', async () => {
      const anotherAdmin = { ...targetUser, role: Role.ADMIN };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        anotherAdmin,
      );

      await expect(
        service.updateUserRole(mockAdminUser, 3, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
