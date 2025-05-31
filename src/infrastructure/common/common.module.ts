import { Global, Module } from '@nestjs/common';
import { ErrorHandlerService } from './error-handler.service';
import { PriceInterceptorService } from './interceptors/price-interceptor.service';
import { StockValidatorService } from './interceptors/stock-validator.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { GraphQLExceptionFilter } from './filters/graphql-exception.filter';
@Global()
@Module({
  providers: [
    ErrorHandlerService,
    PriceInterceptorService,
    StockValidatorService,
    GlobalExceptionFilter,
    GraphQLExceptionFilter,
  ],
  exports: [
    ErrorHandlerService,
    PriceInterceptorService,
    StockValidatorService,
    GlobalExceptionFilter,
    GraphQLExceptionFilter,
  ],
})
export class CommonModule {}
