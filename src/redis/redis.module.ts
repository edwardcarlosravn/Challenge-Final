// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisStockAlert } from './redis-stock-alert.service';
import { StockNotificationsProcessor } from './stock-notifications.processort';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { EmailModule } from '../infrastructure/http/controllers/mails/mails.module';
import { FileUploadModule } from 'src/infrastructure/graphql/service/images/file-upload.module';
import { EmailTemplateService } from 'src/infrastructure/notifications/email-template.service';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'stock-notifications',
    }),
    PersistenceModule,
    EmailModule,
    FileUploadModule,
  ],
  providers: [
    RedisStockAlert,
    StockNotificationsProcessor,
    EmailTemplateService,
  ],
  exports: [RedisStockAlert],
})
export class RedisModule {}
