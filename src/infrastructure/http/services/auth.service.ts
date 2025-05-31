import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AccountStatus, OTP, OTPType, User } from '@prisma/client';
import { ConfigService, ConfigType } from '@nestjs/config';
import { TokenPayload } from '../controllers/auth/types/token-payload.interface';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from '../controllers/auth/config/refresh-jwt.config';
import * as argon2 from 'argon2';
import { CurrentUser } from '../controllers/auth/types/current-user';
import { OTPService } from './opt.service';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { CreateUserRequest } from '../dto/user/create-user.request';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}
  async refreshToken(user: User) {
    const { accessToken, refreshToken } = await this.generateTokens(user);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      { id: user.id },
      hashedRefreshToken,
    );
    return {
      id: user.id,
      accessToken,
      refreshToken,
    };
  }
  async login(user: User, providedOtp?: string) {
    if (user.accountStatus === 'UNVERIFIED') {
      if (!providedOtp) {
        return {
          message:
            'Your account is not verified.Please provide your otp to verify.',
        };
      } else {
        if (typeof providedOtp !== 'string' || providedOtp.trim() === '') {
          return {
            message: 'OTP is required for unverified accounts.',
          };
        }
        await this.verifyToken(user.id, providedOtp);

        user = await this.usersService.getUser({ id: user.id });
      }
    }
    const { accessToken, refreshToken } = await this.generateTokens(user);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.updateHashedRefreshToken(
      { id: user.id },
      hashedRefreshToken,
    );
    return {
      id: user.id,
      accessToken,
      refreshToken,
    };
  }
  async verifyToken(userId: number, token: string): Promise<User> {
    await this.otpService.validateOTP(userId, token);

    await this.usersService.getUser({ id: userId });

    const updatedUser = await this.usersService.updateAccountStatus(
      userId,
      AccountStatus.VERIFIED,
    );

    return updatedUser;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const userId = this.otpService.validateResetPassword(token);
    const user = await this.usersService.getUser({ id: userId });

    if (!user) {
      throw new BadRequestException('User not found for the provided token.');
    }
    const hashedPassword = await argon2.hash(newPassword);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { message: 'Password reset successfully' };
  }
  findActiveOtpForUser(
    userId: number,
    type: OTPType = OTPType.otp,
  ): Promise<OTP | null> {
    return this.prismaService.oTP.findFirst({
      where: {
        userId: userId,
        type: type,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async hasActiveOtp(
    userId: number,
    type: OTPType = OTPType.otp,
  ): Promise<boolean> {
    const activeOtp = await this.findActiveOtpForUser(userId, type);
    return !!activeOtp;
  }

  async generateTokens(user: User) {
    const tokenPayload: TokenPayload = {
      userId: user.id,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(tokenPayload, {
        expiresIn: this.configService.getOrThrow('JWT_EXPIRATION'),
      }),
      this.jwtService.sign(tokenPayload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }
  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.getUser({ email });
      const authenticated = await argon2.verify(user.password, password);
      if (!authenticated)
        throw new UnauthorizedException('Credentials are not valid');
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Credentials are not valid');
    }
  }
  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.usersService.getUser({ id: userId });
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Invalid refresh Token');
    const refreshTokenMatches = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid refresh Token');
    return { id: userId };
  }
  async signOut(userId: number) {
    await this.usersService.updateHashedRefreshToken({ id: userId }, null);
  }
  async validateJwtUser(userId: number) {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) throw new UnauthorizedException('User not found!');
    const currentUser: CurrentUser = {
      id: user.id,
      role: user.role,
    };
    return currentUser;
  }
  async signUp(createUserRequest: CreateUserRequest) {
    const user = await this.usersService.createUser(createUserRequest);

    return user;
  }
}
