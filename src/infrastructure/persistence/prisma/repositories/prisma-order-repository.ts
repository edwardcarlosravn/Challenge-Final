import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderRepository } from 'src/application/contracts/persistence/order-repository.interface';
import { Order } from 'src/domain/order';
import { OrderMapper } from '../mappers/order-mapper';
import { CreateOrderFromCartDto } from 'src/application/dto/orders/create-order-from-cart.dto';
import { GetUserOrdersDto } from 'src/application/dto/orders/get-user-orders.dto';
import { PaginatedResponse } from 'src/application/contracts/persistence/order-repository.interface';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { PriceInterceptorService } from 'src/infrastructure/common/interceptors/price-interceptor.service';
import { Prisma } from '@prisma/client';
import { StockValidatorService } from 'src/infrastructure/common/interceptors/stock-validator.service';
@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly stockValidator: StockValidatorService,
    private readonly priceInterceptor: PriceInterceptorService,
  ) {}

  private async executeInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'orderTransaction');
      throw error;
    }
  }

  private async updateStock(
    tx: Prisma.TransactionClient,
    productItemId: number,
    quantityChange: number,
  ): Promise<void> {
    await tx.productItem.update({
      where: { id: productItemId },
      data: { stock: { increment: quantityChange } },
    });
  }

  private async recalculateOrderTotal(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const lines = await tx.orderLine.findMany({ where: { orderId } });
    const total = lines.reduce(
      (sum, line) => sum + Number(line.price) * line.quantity,
      0,
    );
    await tx.shopOrder.update({
      where: { id: orderId },
      data: { orderTotal: new Prisma.Decimal(total), updated_at: new Date() },
    });
  }

  private async getUserCart(tx: Prisma.TransactionClient, userId: number) {
    return tx.shoppingCart.findFirst({
      where: { userId },
      include: { items: { include: { productItem: true } } },
    });
  }

  private async createOrderWithLines(
    tx: Prisma.TransactionClient,
    userId: number,
    shippingAddress: string,
    orderLines: Prisma.OrderLineCreateWithoutOrderInput[],
    orderTotal: number,
  ) {
    return tx.shopOrder.create({
      data: {
        userId,
        shippingAddress,
        orderStatus: 'PENDING',
        orderDate: new Date(),
        orderTotal: new Prisma.Decimal(orderTotal),
        orderLines: { create: orderLines },
      },
      include: { orderLines: { include: { productItem: true } } },
    });
  }

  async createFromCart(data: CreateOrderFromCartDto): Promise<Order> {
    return this.executeInTransaction(async (tx) => {
      const cart = await this.getUserCart(tx, data.userId);
      if (!cart?.items?.length) throw new Error('Cart is empty or not found');

      const stockValidation = await this.stockValidator.validateCartStock(
        cart.items,
      );
      if (!stockValidation.isValid) {
        const errorMessage = stockValidation.insufficientStockItems
          .map(
            (item) =>
              `${item.sku}: Available ${item.available}, Required ${item.requested}`,
          )
          .join(', ');
        throw new Error(`Insufficient stock: ${errorMessage}`);
      }

      const itemsWithPrices =
        await this.priceInterceptor.getCartItemsWithCurrentPrices(cart.items);
      const orderTotal = await this.priceInterceptor.calculateOrderTotal(
        cart.items,
      );

      const orderLines = itemsWithPrices.map((item) => ({
        quantity: item.quantity,
        price: new Prisma.Decimal(item.currentPrice),
        created_at: new Date(),
        productItem: { connect: { id: item.productItemId } },
      }));

      const createdOrder = await this.createOrderWithLines(
        tx,
        data.userId,
        data.shippingAddress,
        orderLines,
        orderTotal,
      );

      await Promise.all(
        cart.items.map((item) =>
          this.updateStock(tx, item.productItemId, -item.quantity),
        ),
      );

      await tx.shoppingCartItem.deleteMany({ where: { cartId: cart.id } });

      return OrderMapper.toDomain(createdOrder);
    });
  }

  async findOrders(dto: GetUserOrdersDto): Promise<PaginatedResponse<Order>> {
    try {
      const page = dto.page || 1;
      const pageSize = dto.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const whereCondition: Prisma.ShopOrderWhereInput = { userId: dto.userId };
      if (dto.status) whereCondition.orderStatus = dto.status;
      if (dto.startDate || dto.endDate) {
        whereCondition.orderDate = {};
        if (dto.startDate) whereCondition.orderDate.gte = dto.startDate;
        if (dto.endDate) whereCondition.orderDate.lte = dto.endDate;
      }

      const [orders, totalItems] = await Promise.all([
        this.prisma.shopOrder.findMany({
          where: whereCondition,
          skip,
          take: pageSize,
          include: { orderLines: { include: { productItem: true } } },
        }),
        this.prisma.shopOrder.count({ where: whereCondition }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: orders.map((order) => OrderMapper.toDomain(order)),
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findOrders');
      throw error;
    }
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    try {
      const updatedOrder = await this.prisma.shopOrder.update({
        where: { id: orderId },
        data: { orderStatus: status, updated_at: new Date() },
        include: { orderLines: true },
      });
      return OrderMapper.toDomain(updatedOrder);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'updateStatus');
      throw error;
    }
  }
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const order = await this.prisma.shopOrder.findUnique({
        where: {
          id: orderId,
        },
        include: {
          orderLines: {
            include: {
              productItem: true,
            },
          },
        },
      });

      if (!order) {
        return null;
      }

      return OrderMapper.toDomain(order);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'GET ORDER');
      throw error;
    }
  }
  async getOrderOrThrow(orderId: string): Promise<Order> {
    try {
      const order = await this.prisma.shopOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          orderLines: {
            include: {
              productItem: true,
            },
          },
        },
      });

      return OrderMapper.toDomain(order);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'GET ORDER OR THROW');
      throw error;
    }
  }
}
