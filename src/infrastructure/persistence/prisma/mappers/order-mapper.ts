import { Order } from 'src/domain/order';
import { OrderLineMapper } from './order-line.mapper';
import {
  ShopOrder as PrismaShopOrder,
  OrderLine as PrismaOrderLine,
  ProductItem as PrismaProductItem,
  ProductItemAttribute as PrismaProductItemAttribute,
  AttributeValue,
  Attribute,
  Prisma,
} from '@prisma/client';

type PrismaOrderWithDetails = PrismaShopOrder & {
  orderLines?: (PrismaOrderLine & {
    productItem?: PrismaProductItem & {
      attributes?: (PrismaProductItemAttribute & {
        attributeValue?: AttributeValue & {
          attribute?: Attribute;
        };
      })[];
    };
  })[];
};

export class OrderMapper {
  static toDomain(raw: PrismaOrderWithDetails): Order {
    const domainOrderLines = raw.orderLines?.map((orderLine) =>
      OrderLineMapper.toDomain(orderLine),
    );

    return new Order(
      raw.id,
      raw.userId,
      raw.shippingAddress,
      raw.orderStatus,
      raw.orderDate,
      raw.orderTotal instanceof Prisma.Decimal
        ? raw.orderTotal.toNumber()
        : Number(raw.orderTotal),
      domainOrderLines,
      raw.created_at,
      raw.updated_at,
    );
  }

  static toPersistence(order: Order): Prisma.ShopOrderCreateInput {
    const data: Prisma.ShopOrderCreateInput = {
      id: order.id,
      shippingAddress: order.shippingAddress,
      orderStatus: order.orderStatus,
      orderDate: order.orderDate,
      orderTotal: new Prisma.Decimal(order.orderTotal),
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      user: {
        connect: { id: order.userId },
      },
    };

    if (order.orderLines && order.orderLines.length > 0) {
      data.orderLines = {
        create: order.orderLines.map((orderLine) =>
          OrderLineMapper.toPersistence(orderLine),
        ),
      };
    }

    return data;
  }

  static toBasicPersistence(
    order: Order,
  ): Omit<Prisma.ShopOrderCreateInput, 'orderLines'> {
    return {
      id: order.id,
      shippingAddress: order.shippingAddress,
      orderStatus: order.orderStatus,
      orderDate: order.orderDate,
      orderTotal: new Prisma.Decimal(order.orderTotal),
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      user: {
        connect: { id: order.userId },
      },
    };
  }
}
