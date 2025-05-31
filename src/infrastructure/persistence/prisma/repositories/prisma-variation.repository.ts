import { Injectable } from '@nestjs/common';
import { VariationMapper } from '../mappers/variation.mapper';
import { PrismaService } from '../prisma.service';
import { ProductVariation } from 'src/domain/variation';
import { CreateVariationDto } from 'src/application/dto/variation/create-variation.dto';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';

@Injectable()
export class PrismaVariationRepository implements VariationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}
  private readonly includeFullData = {
    items: {
      include: {
        attributes: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
              },
            },
          },
        },
      },
    },
  };
  async create(variation: CreateVariationDto): Promise<ProductVariation> {
    const { productId, items = [] } = variation;

    const created = await this.prisma.productVariation.create({
      data: {
        productId,
        is_active: true,
        items: {
          create: items.map((item) => ({
            sku: item.sku,
            price: item.price,
            stock: item.stock || 0,
            attributes: {
              create:
                item.attributes?.map((attr) => ({
                  attributeValueId: attr.attributeValueId,
                })) || [],
            },
          })),
        },
      },
      include: this.includeFullData,
    });

    return VariationMapper.toDomain(created);
  }
  async update(
    id: string,
    data: Partial<{ isActive: boolean }>,
  ): Promise<ProductVariation> {
    const updated = await this.prisma.productVariation.update({
      where: { id },
      data: {
        is_active: data.isActive,
      },
      include: {
        items: {
          include: {
            attributes: true,
          },
        },
      },
    });

    return VariationMapper.toDomain(updated);
  }
  async findById(id: string): Promise<ProductVariation | null> {
    const variation = await this.prisma.productVariation.findUnique({
      where: { id },
      include: this.includeFullData,
    });

    return variation ? VariationMapper.toDomain(variation) : null;
  }

  async findAll(): Promise<ProductVariation[]> {
    const variations = await this.prisma.productVariation.findMany({
      where: { is_active: true },
      include: this.includeFullData,
    });

    return variations.map((variation) => VariationMapper.toDomain(variation));
  }
  async updateStatus(id: string, isActive: boolean): Promise<ProductVariation> {
    const updated = await this.prisma.productVariation.update({
      where: { id },
      data: {
        is_active: isActive,
      },
      include: {
        items: {
          include: {
            attributes: true,
          },
        },
      },
    });

    return VariationMapper.toDomain(updated);
  }
}
