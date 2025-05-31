import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

@Injectable()
export class DeactivateVariationUseCase {
  constructor(
    @Inject('VariationRepository')
    private readonly variationRepository: VariationRepository,
  ) {}

  async execute(variationId: string): Promise<ProductVariation> {
    const variation = await this.variationRepository.findById(variationId);

    if (!variation) {
      throw new NotFoundException(`Variation with id ${variationId} not found`);
    }

    return this.variationRepository.updateStatus(variationId, false);
  }
}
