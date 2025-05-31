import { Injectable, Inject } from '@nestjs/common';
import { CreateVariationDto } from 'src/application/dto/variation/create-variation.dto';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';

@Injectable()
export class CreateVariationUseCase {
  constructor(
    @Inject('VariationRepository')
    private readonly variationRepository: VariationRepository,
  ) {}

  async execute(
    createVariationDto: CreateVariationDto,
  ): Promise<ProductVariation> {
    return this.variationRepository.create(createVariationDto);
  }
}
