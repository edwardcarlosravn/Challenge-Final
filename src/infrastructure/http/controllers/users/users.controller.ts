import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Delete,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserRequest } from '../../dto/user/create-user.request';
import { UsersService } from '../../services/users.service';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guar';
import { CurrentUser } from '../../decorators/auth/current-user.decorator';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { Role } from '../../enums/auth/role.enums';
import { Roles } from '../../decorators/auth/roles.decorators';
import { RolesGuard } from '../../guards/auth/roles/roles.guard';
import { UpdateUserRoleDto } from '../../dto/user/role-user.request';
import { OTPType, User } from '@prisma/client';
import { RequestTokenDto } from '../../dto/user/requestToken.dto';
import { EmailService } from '../../services/mails.service';
import { SkipThrottle } from '@nestjs/throttler';

@Roles(Role.CLIENT)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}
  @SkipThrottle()
  @Post()
  createUser(@Body() request: CreateUserRequest) {
    return this.usersService.createUser(request);
  }
  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
  // @SetMetadata('role', [Role.ADMIN])
  @SkipThrottle()
  @Patch(':user_id/role')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('user_id') targetUserIdString: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() adminUser: User,
  ) {
    const targetUserId = parseInt(targetUserIdString, 10);
    return this.usersService.updateUserRole(
      adminUser,
      targetUserId,
      updateUserRoleDto.newRole,
    );
  }
  @SkipThrottle()
  @Post('request-otp')
  async requestOTP(@Body() dto: RequestTokenDto) {
    const { email } = dto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.emailService.sendVerificationEmail(user, OTPType.otp);
    return { message: 'OTP sent successfully.Please check email' };
  }
}
