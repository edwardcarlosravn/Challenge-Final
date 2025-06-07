/* eslint-disable @typescript-eslint/unbound-method */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ErrorHandlerService } from 'src/infrastructure/common/error-handler.service';
import { PrismaProductItemRepository } from './prisma-product-item.repository';
import { ProductItemMapper } from '../mappers/producItem.mapper';
import { ProductItem } from 'src/domain/product-item';

jest.mock('../mappers/producItem.mapper');

describe('PrismaProductItemRepository', () => {
  let repository: PrismaProductItemRepository;
  let prismaService: PrismaService;
  let errorHandlerService: ErrorHandlerService;

  const mockProductItemDomain = new ProductItem(
    1,
    '59e0ec03-57fd-444b-9ecc-21ac861f00d0',
    'TEST-SKU-001',
    29.99,
    100,
    [
      {
        attributeValueId: 1,
      },
    ],
  );

  const mockPrismaProductItem = {
    id: 1,
    variationId: '59e0ec03-57fd-444b-9ecc-21ac861f00d0',
    sku: 'TEST-SKU-001',
    price: 29.99,
    stock: 100,
    variation: {
      id: '59e0ec03-57fd-444b-9ecc-21ac861f00d0',
      name: 'Red XL',
      productId: 1,
    },
    attributes: [
      {
        id: 1,
        productItemId: 1,
        attributeValueId: 1,
        attributeValue: {
          id: 1,
          value: 'Red',
          attributeId: 1,
          attribute: {
            id: 1,
            name: 'Color',
          },
        },
      },
    ],
  };

  const mockItemRelations = {
    orderLines: [{ id: 1 }],
    cartItems: [{ id: 1 }],
    favorites: [{ id: 1 }],
  };

  const mockTransaction = {
    orderLine: { deleteMany: jest.fn() },
    shoppingCartItem: { deleteMany: jest.fn() },
    userFavorite: { deleteMany: jest.fn() },
    stockAlert: { deleteMany: jest.fn() },
    productItemAttribute: { deleteMany: jest.fn() },
    productItem: { delete: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaProductItemRepository,
        {
          provide: PrismaService,
          useValue: {
            productItem: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleDatabaseError: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<PrismaProductItemRepository>(
      PrismaProductItemRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return product item when found with all relations', async () => {
      (prismaService.productItem.findUnique as jest.Mock).mockResolvedValue(
        mockPrismaProductItem,
      );
      (ProductItemMapper.toDomain as jest.Mock).mockReturnValue(
        mockProductItemDomain,
      );

      const result = await repository.findById(1);

      expect(prismaService.productItem.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          variation: true,
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
      });
      expect(ProductItemMapper.toDomain).toHaveBeenCalledWith(
        mockPrismaProductItem,
      );
      expect(result).toEqual(mockProductItemDomain);
    });

    it('should return null when product item not found', async () => {
      (prismaService.productItem.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await repository.findById(999);

      expect(prismaService.productItem.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          variation: true,
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
      });
      expect(ProductItemMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle database error during product item retrieval', async () => {
      const error = new Error('Database connection error');
      (prismaService.productItem.findUnique as jest.Mock).mockRejectedValue(
        error,
      );

      await repository.findById(1);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'findById',
      );
    });
  });

  describe('deleteById', () => {
    beforeEach(() => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockProductItemDomain);
    });

    it('should delete product item successfully', async () => {
      (prismaService.productItem.findUnique as jest.Mock).mockResolvedValue({
        orderLines: [],
        cartItems: [],
        favorites: [],
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      await repository.deleteById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(prismaService.productItem.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          orderLines: { select: { id: true } },
          cartItems: { select: { id: true } },
          favorites: { select: { id: true } },
        },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(mockTransaction.stockAlert.deleteMany).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(
        mockTransaction.productItemAttribute.deleteMany,
      ).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(mockTransaction.productItem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should delete product item and all related data when relations exist', async () => {
      (prismaService.productItem.findUnique as jest.Mock).mockResolvedValue(
        mockItemRelations,
      );
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      await repository.deleteById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(mockTransaction.orderLine.deleteMany).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(mockTransaction.shoppingCartItem.deleteMany).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(mockTransaction.userFavorite.deleteMany).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(mockTransaction.stockAlert.deleteMany).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(
        mockTransaction.productItemAttribute.deleteMany,
      ).toHaveBeenCalledWith({
        where: { productItemId: 1 },
      });
      expect(mockTransaction.productItem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when product item not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await repository.deleteById(999);

      expect(repository.findById).toHaveBeenCalledWith(999);
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        new Error('ProductItem with ID 999 not found'),
        'deleteById',
      );
    });

    it('should handle database error during transaction', async () => {
      const error = new Error('Transaction failed');
      (prismaService.productItem.findUnique as jest.Mock).mockResolvedValue(
        mockItemRelations,
      );
      (prismaService.$transaction as jest.Mock).mockRejectedValue(error);

      await repository.deleteById(1);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'deleteById',
      );
    });

    it('should handle database error during relations check', async () => {
      const error = new Error('Relations query failed');
      (prismaService.productItem.findUnique as jest.Mock).mockRejectedValue(
        error,
      );

      await repository.deleteById(1);

      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        error,
        'deleteById',
      );
    });
  });
});
