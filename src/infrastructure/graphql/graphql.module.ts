import { join } from 'path';
import { Module } from '@nestjs/common';
import { ProductModule } from './resolvers/product/product.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { CategoryModule } from './resolvers/category/category.module';
import { VariationModule } from './resolvers/variation/variation.module';
import { FileUploadModule } from './service/images/file-upload.module';
import { ShoppingCartModule } from './resolvers/shopping-cart/shopping-cart.module';
import { OrderModule } from './resolvers/order/order.module';
import { ProductItemModule } from './resolvers/product-item/product-item.module';
import { FavoritesModule } from './resolvers/favorite/favorite.module';
import { GraphQLExceptionFilter } from '../common/filters/graphql-exception.filter';
import { APP_FILTER } from '@nestjs/core';
@Module({
  imports: [
    FileUploadModule,
    ProductModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({
        req,
        res,
      }: {
        req: Request;
        res: Response;
      }): { req: Request; res: Response } => ({ req, res }),
      formatError: (error) => {
        const originalError = error.extensions?.originalError;
        if (
          !originalError ||
          typeof originalError !== 'object' ||
          typeof (originalError as Error).message !== 'string'
        ) {
          return {
            message: error.message,
            code: error.extensions?.code,
          };
        }
        return {
          message: (originalError as Error).message,
          code: error.extensions?.code,
        };
      },
    }),
    CategoryModule,
    VariationModule,
    ShoppingCartModule,
    OrderModule,
    ProductItemModule,
    FavoritesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GraphQLExceptionFilter,
    },
  ],
})
export class GraphqlModule {}
