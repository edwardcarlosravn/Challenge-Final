import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from 'src/infrastructure/graphql/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from 'src/infrastructure/graphql/guards/gql-roles.guard';
import { DeleteProductItemUseCase } from 'src/application/use-cases/variation/delete-product-item.use-case';
import { DeleteProductItemInput } from '../../dto/variation/delete-product-item.input';
import { Roles } from 'src/infrastructure/http/decorators/auth/roles.decorators';
import { Role } from 'src/infrastructure/http/enums/auth/role.enums';

@Resolver()
export class ProductItemResolver {
  constructor(
    private readonly deleteProductItemUseCase: DeleteProductItemUseCase,
  ) {}

  @Roles(Role.ADMIN)
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Mutation(() => Boolean)
  async deleteProductItem(
    @Args('input') input: DeleteProductItemInput,
  ): Promise<boolean> {
    await this.deleteProductItemUseCase.execute(input.id);
    return true;
  }
}
