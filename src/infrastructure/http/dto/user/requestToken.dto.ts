import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestTokenDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
