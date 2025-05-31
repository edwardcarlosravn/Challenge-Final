import { Module } from '@nestjs/common';
import { VariationResolver } from './variation.resolver';
import { CreateVariationUseCase } from 'src/application/use-cases/variation/create-variation.user-case';
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [VariationResolver, CreateVariationUseCase],
})
export class VariationModule {}
