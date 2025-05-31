import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../../guards/auth/local-auth.guard';
import { CurrentUser } from '../../decorators/auth/current-user.decorator';
import { OTPType, User } from '@prisma/client';
import { AuthService } from '../../services/auth.service';
import { RefreshAuthGuard } from '../../guards/auth/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guar';
import { TokenPayload } from './types/token-payload.interface';
import { LoginDto } from '../../dto/auth/login.dto';
import { ForgotPasswordDto } from '../../dto/auth/forgot-password.dto';
import { EmailService } from '../../services/mails.service';
import { Throttle } from '@nestjs/throttler';
import { CreateUserRequest } from '../../dto/user/create-user.request';
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly emailService: EmailService,
  ) {}
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() createUserRequest: CreateUserRequest) {
    return this.authService.signUp(createUserRequest);
  }
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: User, @Body() opt: LoginDto) {
    console.log(opt);
    return this.authService.login(user, opt.otp);
  }
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@CurrentUser() user: User) {
    return this.authService.refreshToken(user);
  }
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  signout(@CurrentUser() user: TokenPayload) {
    return this.authService.signOut(user.userId);
  }
  @Throttle({ short: { limit: 1, ttl: 1000 } })
  @Throttle({ medium: { limit: 3, ttl: 300000 } })
  @Post('reset-password')
  resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ) {
    return this.authService.resetPassword(token, password);
  }
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    await this.emailService.sendVerificationEmail(user, OTPType.reset_password);
    return { message: 'If an account exists, a reset link has been sent.' };
  }
}
