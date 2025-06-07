/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaVariationRepository } from './prisma-variation.repository';
import { PrismaService } from '../prisma.service';
import { VariationMapper } from '../mappers/variation.mapper';
import { ProductVariation } from 'src/domain/variation';
import {
  CreateVariationDto,
  CreateVariationItemDto,
  CreateItemAttributeDto,
} from 'src/application/dto/variation/create-variation.dto';

jest.mock('../mappers/variation.mapper');

describe('PrismaVariationRepository', () => {
  let repository: PrismaVariationRepository;
  let mockPrismaService: any;

  const mockVariationId = 'variation-123';
  const mockProductId = 'product-456';

  const mockCreateItemAttributeDto: CreateItemAttributeDto = {
    attributeValueId: 789,
  };

  const mockCreateVariationItemDto: CreateVariationItemDto = {
    sku: 'TEST-SKU-001',
    price: 29.99,
    stock: 50,
    attributes: [mockCreateItemAttributeDto],
  };

  const mockCreateVariationDto: CreateVariationDto = {
    productId: mockProductId,
    items: [mockCreateVariationItemDto],
  };

  const mockPrismaVariationResponse = {
    id: mockVariationId,
    productId: mockProductId,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    items: [
      {
        id: 123,
        variationId: mockVariationId,
        sku: 'TEST-SKU-001',
        price: 29.99,
        stock: 50,
        created_at: new Date(),
        updated_at: new Date(),
        attributes: [
          {
            id: 456,
            productItemId: 123,
            attributeValueId: 789,
            attributeValue: {
              id: 789,
              value: 'Red',
              attributeId: 111,
              attribute: {
                id: 111,
                name: 'Color',
                created_at: new Date(),
                updated_at: new Date(),
              },
            },
          },
        ],
      },
    ],
    images: [],
  };

  const mockDomainVariation = new ProductVariation(
    mockVariationId,
    mockProductId,
    true,
    [],
    [],
  );

  const mockUpdatedDomainVariation = new ProductVariation(
    mockVariationId,
    mockProductId,
    false,
    [],
    [],
  );

  beforeEach(async () => {
    mockPrismaService = {
      productVariation: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaVariationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaVariationRepository>(
      PrismaVariationRepository,
    );
    (VariationMapper.toDomain as jest.Mock) = jest.fn();
  });

  describe('create', () => {
    // ✅ NECESARIO - Happy path principal (incluye casos con/sin items)
    it('should create variation with nested items and attributes', async () => {
      mockPrismaService.productVariation.create.mockResolvedValue(
        mockPrismaVariationResponse,
      );
      (VariationMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainVariation,
      );

      const result = await repository.create(mockCreateVariationDto);

      expect(mockPrismaService.productVariation.create).toHaveBeenCalledWith({
        data: {
          productId: mockProductId,
          is_active: true,
          items: {
            create: [
              {
                sku: 'TEST-SKU-001',
                price: 29.99,
                stock: 50,
                attributes: {
                  create: [
                    {
                      attributeValueId: 789,
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
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
        },
      });
      expect(VariationMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaVariationResponse,
      );
      expect(result).toBe(mockDomainVariation);
    });

    // ✅ NECESARIO - Error handling
    it('should handle database error during variation creation', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.productVariation.create.mockRejectedValue(dbError);

      await expect(repository.create(mockCreateVariationDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('update', () => {
    // ✅ NECESARIO - Happy path principal
    it('should update variation properties successfully', async () => {
      const updateData = { isActive: false };
      const mockUpdatedResponse = {
        ...mockPrismaVariationResponse,
        is_active: false,
      };

      mockPrismaService.productVariation.update.mockResolvedValue(
        mockUpdatedResponse,
      );
      (VariationMapper.toDomain as jest.Mock).mockReturnValue(
        mockUpdatedDomainVariation,
      );

      const result = await repository.update(mockVariationId, updateData);

      expect(mockPrismaService.productVariation.update).toHaveBeenCalledWith({
        where: { id: mockVariationId },
        data: {
          is_active: false,
        },
        include: {
          items: {
            include: {
              attributes: true,
            },
          },
        },
      });
      expect(VariationMapper.toDomain).toHaveBeenCalledWith(
        mockUpdatedResponse,
      );
      expect(result).toBe(mockUpdatedDomainVariation);
    });

    // ✅ NECESARIO - Error handling
    it('should handle database error during variation update', async () => {
      const notFoundError = new Error('Record not found');
      mockPrismaService.productVariation.update.mockRejectedValue(
        notFoundError,
      );

      await expect(
        repository.update('non-existent-id', { isActive: true }),
      ).rejects.toThrow('Record not found');
    });
  });

  describe('findById', () => {
    // ✅ NECESARIO - Happy path
    it('should return variation when found with complete nested data', async () => {
      mockPrismaService.productVariation.findUnique.mockResolvedValue(
        mockPrismaVariationResponse,
      );
      (VariationMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainVariation,
      );

      const result = await repository.findById(mockVariationId);

      expect(
        mockPrismaService.productVariation.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: mockVariationId },
        include: {
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
        },
      });
      expect(VariationMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaVariationResponse,
      );
      expect(result).toBe(mockDomainVariation);
    });

    // ✅ NECESARIO - Caso null importante
    it('should return null when variation not found', async () => {
      mockPrismaService.productVariation.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(VariationMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    // ✅ NECESARIO - Error handling
    it('should handle database error during variation retrieval', async () => {
      const dbError = new Error('Database timeout');
      mockPrismaService.productVariation.findUnique.mockRejectedValue(dbError);

      await expect(repository.findById(mockVariationId)).rejects.toThrow(
        'Database timeout',
      );
    });
  });

  describe('findAll', () => {
    // ✅ NECESARIO - Happy path
    it('should return all active variations with complete data', async () => {
      const mockVariationsArray = [mockPrismaVariationResponse];
      mockPrismaService.productVariation.findMany.mockResolvedValue(
        mockVariationsArray,
      );
      (VariationMapper.toDomain as jest.Mock).mockReturnValue(
        mockDomainVariation,
      );

      const result = await repository.findAll();

      expect(mockPrismaService.productVariation.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        include: {
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
        },
      });
      expect(VariationMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaVariationResponse,
      );
      expect(result).toEqual([mockDomainVariation]);
    });

    // ✅ NECESARIO - Error handling
    it('should handle database error during all variations retrieval', async () => {
      const dbError = new Error('Connection lost');
      mockPrismaService.productVariation.findMany.mockRejectedValue(dbError);

      await expect(repository.findAll()).rejects.toThrow('Connection lost');
    });
  });

  describe('updateStatus', () => {
    // ✅ NECESARIO - Happy path del método wrapper
    it('should update variation status using convenience method', async () => {
      mockPrismaService.productVariation.update.mockResolvedValue({
        ...mockPrismaVariationResponse,
        is_active: false,
      });
      (VariationMapper.toDomain as jest.Mock).mockReturnValue(
        mockUpdatedDomainVariation,
      );

      const result = await repository.updateStatus(mockVariationId, false);

      expect(mockPrismaService.productVariation.update).toHaveBeenCalledWith({
        where: { id: mockVariationId },
        data: {
          is_active: false,
        },
        include: {
          items: {
            include: {
              attributes: true,
            },
          },
        },
      });
      expect(result).toBe(mockUpdatedDomainVariation);
    });

    // ✅ NECESARIO - Error propagation del método wrapper
    it('should propagate errors from updateStatus', async () => {
      const notFoundError = new Error('Variation not found');
      mockPrismaService.productVariation.update.mockRejectedValue(
        notFoundError,
      );

      await expect(
        repository.updateStatus('non-existent-id', true),
      ).rejects.toThrow('Variation not found');
    });
  });
});
