import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token should not be empty.' })
  @IsString()
  token: string;
  @IsNotEmpty({ message: 'New password should be not empty' })
  @IsString()
  @MinLength(8, {
    message: 'New Password must be at least 8 characters longs.',
  })
  newPassword: string;
  confirmPassword: string;
}
