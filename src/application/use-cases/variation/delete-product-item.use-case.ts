import { Injectable, Inject } from '@nestjs/common';
import { ProductItemRepository } from 'src/application/contracts/persistence/productItem-repository.interface';

@Injectable()
export class DeleteProductItemUseCase {
  constructor(
    @Inject('ProductItemRepository')
    private readonly productItemRepository: ProductItemRepository,
  ) {}

  async execute(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid ProductItem ID is required');
    }
    const existingItem = await this.productItemRepository.findById(id);
    if (!existingItem) {
      throw new Error(`ProductItem with ID ${id} not found`);
    }
    await this.productItemRepository.deleteById(id);
  }
}
