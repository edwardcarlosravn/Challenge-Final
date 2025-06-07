import { Module } from '@nestjs/common';
import { GraphqlModule } from './infrastructure/graphql/graphql.module';
import { PersistenceModule } from './infrastructure/persistence/persistence.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from './infrastructure/http/http.module';
import { CommonModule } from './infrastructure/common/common.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from './redis/redis.module';
import { GlobalExceptionFilter } from './infrastructure/common/filters/global-exception.filter';
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'stock-notifications',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    CommonModule,
    PersistenceModule.register({
      global: true,
    }),
    ConfigModule.forRoot(),
    GraphqlModule,
    HttpModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
