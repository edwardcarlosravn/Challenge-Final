import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ProductVariationType } from '../../entities/variation.entity';
import { CreateVariationInput } from '../../dto/variation/create-product-variation.input';
import { CreateVariationUseCase } from 'src/application/use-cases/variation/create-variation.user-case';

@Resolver(() => ProductVariationType)
export class VariationResolver {
  constructor(
    private readonly createVariationUseCase: CreateVariationUseCase,
  ) {}

  @Mutation(() => ProductVariationType)
  async createVariation(
    @Args('input') input: CreateVariationInput,
  ): Promise<ProductVariationType> {
    if (!input.productId) {
      throw new Error('productId is required');
    }
    const variation = await this.createVariationUseCase.execute({
      productId: input.productId,
      items:
        input.items?.map((item) => ({
          sku: item.sku,
          price: item.price,
          stock: item.stock || 0,
          attributes:
            item.attributes?.map((attr) => ({
              attributeValueId: attr.attributeValueId,
            })) || [],
        })) || [],
    });

    return {
      id: variation.id,
      productId: variation.productId,
      isActive: variation.isActive,
      items:
        variation.items?.map((item) => ({
          id: item.id.toString(),
          variationId: item.variationId,
          sku: item.sku,
          price: item.price,
          stock: item.stock,
          attributes: item.attributes || [],
        })) || [],
    };
  }
}
