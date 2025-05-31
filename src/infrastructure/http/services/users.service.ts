import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserRequest } from '../dto/user/create-user.request';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AccountStatus, OTPType, Prisma, Role, User } from '@prisma/client';
import { EmailService } from './mails.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import * as argon2 from 'argon2';
@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
  ) {}
  async updateAccountStatus(
    userId: number,
    newStatus: AccountStatus,
  ): Promise<User> {
    if (!Object.values(AccountStatus).includes(newStatus)) {
      throw new ForbiddenException(`Invalid account status: ${newStatus}`);
    }
    return this.prismaService.user.update({
      where: { id: userId },
      data: { accountStatus: newStatus },
    });
  }
  async createUser(data: CreateUserRequest) {
    try {
      const hashedPassword = await argon2.hash(data.password);
      const createdUser = await this.prismaService.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
      await this.emailService.sendVerificationEmail(createdUser, OTPType.otp);
      return createdUser;
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new UnprocessableEntityException('Email already exists');
      }
      throw error;
    }
  }
  async findByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({
      where: { email },
    });
  }
  async updateHashedRefreshToken(
    filter: Prisma.UserWhereUniqueInput,
    hashedRefreshToken: string | null,
  ) {
    return this.prismaService.user.update({
      where: filter,
      data: { hashedRefreshToken },
    });
  }
  async getUser(filter: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUniqueOrThrow({
      where: filter,
    });
  }
  remove(id: number) {
    return `This action removes a ${id} users`;
  }
  async updateUserRole(
    adminUser: User,
    targetUserId: number,
    newRole: Role,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    if (adminUser.id === targetUserId)
      throw new ForbiddenException(
        'Administrators cannot change their own role via this endpoint',
      );
    const targetUser = await this.prismaService.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException(`User with Id: ${targetUserId} not found.`);
    }
    if (targetUser.role === Role.ADMIN)
      throw new ForbiddenException('Cannot the role of another administrator');
    const updateUser = await this.prismaService.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
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
    return updateUser;
  }
}
