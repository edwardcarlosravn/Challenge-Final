import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../../services/mails.service';
import { sendEmailDto } from '../../dto/mails/email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendMail(@Body() dto: sendEmailDto) {
    await this.emailService.sendEmail(dto);
    return { message: 'Email sent successfully' };
  }
}
