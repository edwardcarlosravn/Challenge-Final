import { OrderLine } from 'src/domain/order-line';
import {
  OrderLine as PrismaOrderLine,
  ProductItem as PrismaProductItem,
  ProductItemAttribute as PrismaProductItemAttribute,
  AttributeValue,
  Attribute,
  Prisma,
} from '@prisma/client';

type PrismaOrderLineWithDetails = PrismaOrderLine & {
  productItem?: PrismaProductItem & {
    attributes?: (PrismaProductItemAttribute & {
      attributeValue?: AttributeValue & {
        attribute?: Attribute;
      };
    })[];
  };
};

export class OrderLineMapper {
  static toDomain(raw: PrismaOrderLineWithDetails): OrderLine {
    return new OrderLine(
      raw.id,
      raw.orderId,
      raw.productItemId,
      raw.quantity,
      raw.price instanceof Prisma.Decimal
        ? raw.price.toNumber()
        : Number(raw.price),
      raw.created_at,
    );
  }

  static toPersistence(
    orderLine: OrderLine,
  ): Prisma.OrderLineCreateWithoutOrderInput {
    return {
      quantity: orderLine.quantity,
      price: new Prisma.Decimal(orderLine.price),
      created_at: orderLine.createdAt,
      productItem: {
        connect: { id: orderLine.productItemId },
      },
    };
  }

  static toStandalonePersistence(
    orderLine: OrderLine,
  ): Prisma.OrderLineCreateInput {
    return {
      quantity: orderLine.quantity,
      price: new Prisma.Decimal(orderLine.price),
      created_at: orderLine.createdAt,
      order: {
        connect: { id: orderLine.orderId },
      },
      productItem: {
        connect: { id: orderLine.productItemId },
      },
    };
  }
}
