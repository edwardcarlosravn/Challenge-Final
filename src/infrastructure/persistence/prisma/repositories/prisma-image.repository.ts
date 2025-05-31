import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VariationImage } from 'src/domain/variation-image';
import { VariationImageMapper } from '../mappers/variation-image.mapper';
import { VariationImageRepository } from 'src/application/contracts/persistence/variation-image.repository';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';

@Injectable()
export class PrismaVariationImageRepository
  implements VariationImageRepository
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async create(s3Key: string, variationId: string): Promise<VariationImage> {
    try {
      const createdImage = await this.prisma.variationImage.create({
        data: {
          s3Key,
          variationId,
        },
      });

      return VariationImageMapper.toDomain(createdImage);
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'create');
    }
  }

  async findManyByVariationId(variationId: string): Promise<VariationImage[]> {
    try {
      const images = await this.prisma.variationImage.findMany({
        where: { variationId },
      });

      return images.map((image) => VariationImageMapper.toDomain(image));
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'findManyByVariationId');
    }
  }
}
