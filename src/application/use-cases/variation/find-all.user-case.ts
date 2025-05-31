import { Injectable, Inject } from '@nestjs/common';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

@Injectable()
export class GetVariationsUseCase {
  constructor(
    @Inject('VariationRepository')
    private readonly variationRepository: VariationRepository,
  ) {}

  async execute(): Promise<ProductVariation[]> {
    return this.variationRepository.findAll();
  }
}
