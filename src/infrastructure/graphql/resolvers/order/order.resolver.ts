import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../../guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../../guards/gql-roles.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from 'src/infrastructure/http/decorators/auth/roles.decorators';
import { Role } from 'src/infrastructure/http/enums/auth/role.enums';
import { OrderType } from '../../entities/order.entity';
import { CreateOrderFromCartUseCase } from 'src/application/use-cases/order/create-order-from-cart.use-case';
import { GetUserOrdersUseCase } from 'src/application/use-cases/order/get-user-orders.use-case';
import { GetOrderDetailsUseCase } from 'src/application/use-cases/order/get-order-details.use-case';
import { UpdateOrderStatusUseCase } from 'src/application/use-cases/order/update-order-status.use-case';
import { CurrentUser as CurrentUserType } from '../../../http/controllers/auth/types/current-user';
import { PaginatedOrderResponse } from '../../dto/order/order-pagination-response';
import { GetOrdersFilterInput } from '../../dto/order/get-orders-filter.input';
import { CreateOrderFromCartInput } from '../../dto/order/create-order-from-cart.input';
import { UpdateOrderStatusInput } from '../../dto/order/update-order-status.input';

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    private readonly createOrderFromCartUseCase: CreateOrderFromCartUseCase,
    private readonly getUserOrdersUseCase: GetUserOrdersUseCase,
    private readonly getOrderDetailsUseCase: GetOrderDetailsUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}
  @SkipThrottle()
  @Query(() => PaginatedOrderResponse, { name: 'myOrders' })
  @UseGuards(GqlJwtAuthGuard)
  async getMyOrders(
    @CurrentUser() user: CurrentUserType,
    @Args('filters', { nullable: true }) filters?: GetOrdersFilterInput,
  ): Promise<PaginatedOrderResponse> {
    const result = await this.getUserOrdersUseCase.execute({
      userId: user.id,
      status: filters?.status,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 10,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });

    return {
      data: result.data.map((order) => OrderType.fromDomainToEntity(order)),
      metadata: {
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: filters?.pageSize || 10,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    };
  }
  @SkipThrottle()
  @Query(() => OrderType, { name: 'orderDetails' })
  @UseGuards(GqlJwtAuthGuard)
  async getOrderDetails(
    @Args('orderId') orderId: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<OrderType> {
    const order = await this.getOrderDetailsUseCase.execute({
      orderId,
      userId: user.id,
    });

    return OrderType.fromDomainToEntity(order);
  }
  @SkipThrottle()
  @Query(() => PaginatedOrderResponse, { name: 'allOrders' })
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(Role.ADMIN)
  async getAllOrders(
    @Args('filters', { nullable: true }) filters?: GetOrdersFilterInput,
  ): Promise<PaginatedOrderResponse> {
    const result = await this.getUserOrdersUseCase.execute({
      userId: 0,
      status: filters?.status,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 10,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });

    return {
      data: result.data.map((order) => OrderType.fromDomainToEntity(order)),
      metadata: {
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: filters?.pageSize || 10,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    };
  }
  @SkipThrottle()
  @Mutation(() => OrderType, { name: 'createOrderFromCart' })
  @UseGuards(GqlJwtAuthGuard)
  async createOrderFromCart(
    @Args('input') input: CreateOrderFromCartInput,
    @CurrentUser() user: CurrentUserType,
  ): Promise<OrderType> {
    const order = await this.createOrderFromCartUseCase.execute({
      userId: user.id,
      shippingAddress: input.shippingAddress,
    });

    return OrderType.fromDomainToEntity(order);
  }
  @SkipThrottle()
  @Mutation(() => OrderType, { name: 'updateOrderStatus' })
  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(Role.ADMIN)
  async updateOrderStatus(
    @Args('input') input: UpdateOrderStatusInput,
  ): Promise<OrderType> {
    const order = await this.updateOrderStatusUseCase.execute({
      orderId: input.orderId,
      newStatus: input.newStatus,
    });

    return OrderType.fromDomainToEntity(order);
  }
}
