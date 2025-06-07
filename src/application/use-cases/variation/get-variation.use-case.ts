import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

@Injectable()
export class GetVariationUseCase {
  constructor(
    @Inject('VariationRepository')
    private readonly variationRepository: VariationRepository,
  ) {}

  async execute(variationId: string): Promise<ProductVariation> {
    if (!variationId || variationId.trim() === '') {
      throw new Error('Variation ID is required');
    }

    const variation = await this.variationRepository.findById(variationId);

    if (!variation) {
      throw new NotFoundException(`Variation with id ${variationId} not found`);
    }

    return variation;
  }
}
