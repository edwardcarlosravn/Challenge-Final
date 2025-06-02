import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';
import { EmailService } from 'src/infrastructure/http/services/mails.service';
import { FileUploadService } from 'src/infrastructure/graphql/service/images/file-upload.service';
import { VariationImageRepository } from 'src/application/contracts/persistence/variation-image.repository';
import { EmailTemplateService } from 'src/infrastructure/notifications/email-template.service';
@Injectable()
@Processor('stock-notifications')
export class StockNotificationsProcessor {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private fileUploadService: FileUploadService,
    @Inject('VariationImageRepository')
    private variationImageRepository: VariationImageRepository,
    private emailTemplateService: EmailTemplateService,
  ) {}

  @Process('notify-user')
  async handleNotification(
    job: Job<{ userId: number; productItemId: number }>,
  ) {
    const { userId, productItemId } = job.data;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const productItem = await this.prisma.productItem.findUnique({
        where: { id: productItemId },
        include: {
          variation: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!user || !productItem) {
        throw new Error('User or ProductItem not found');
      }

      let imageUrl: string | null = null;

      if (productItem.variation?.id) {
        try {
          const images =
            await this.variationImageRepository.findManyByVariationId(
              productItem.variation.id,
            );

          if (images && images.length > 0) {
            const firstImage = images[0];
            imageUrl = this.fileUploadService.getPublicUrl(firstImage.s3Key);
          } else {
            throw new Error('No images found for this variation');
          }
        } catch (error) {
          throw new Error(`Error getting variation images: ${error}`);
        }
      }

      const productName = productItem.variation?.product?.name || 'Product';
      const subject = `⚠️ Low Stock Alert for ${productName}!`;

      const emailData = {
        userName: user.first_name || user.email.split('@')[0] || 'Client',
        userEmail: user.email,
        productName,
        sku: productItem.sku,
        price: productItem.price.toNumber(),
        stock: productItem.stock,
        imageUrl: imageUrl || undefined,
      };

      const htmlContent =
        this.emailTemplateService.generateStockAlertHtml(emailData);
      const transport = this.emailService.emailTransport();
      const options = {
        from: this.emailService['configService'].get<string>('EMAIL_USER'),
        to: user.email,
        subject,
        html: htmlContent,
      };

      await transport.sendMail(options);
    } catch (error) {
      throw new Error(`Failed to send stock alert email: ${error}`);
    }
  }
}
