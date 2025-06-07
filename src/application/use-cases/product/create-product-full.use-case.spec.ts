import { Test, TestingModule } from '@nestjs/testing';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';
import { CreateProductUseCase } from './create-product-full.use-case';
import { CreateProductWithVariationsDto } from 'src/application/dto/product/create-product.dto';
import { Product } from 'src/domain/product';
import { Category } from 'src/domain/category';
import { BadRequestException } from '@nestjs/common';

describe('CreateProductUseCase', () => {
  let createProductUseCase: CreateProductUseCase;
  let productRepositoryMock: jest.Mocked<ProductRepository>;

  const mockCreateProductDto: CreateProductWithVariationsDto = {
    name: 'Test T-Shirt',
    description: 'A comfortable test t-shirt',
    categoryIds: ['T-Shirts', 'Cotton'],
    variations: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        items: [
          {
            sku: 'TSHIRT-M-RED-001',
            price: 29.99,
            stock: 10,
            attributes: [{ attributeValueId: 1 }, { attributeValueId: 2 }],
          },
        ],
      },
    ],
  };

  const mockCategories: Category[] = [
    new Category(
      1,
      'T-Shirts',
      't-shirts',
      'T-shirts collection',
      true,
      new Date(),
    ),
    new Category(2, 'Cotton', 'cotton', 'Cotton materials', true, new Date()),
  ];

  const mockProduct: Product = new Product(
    '550e8400-e29b-41d4-a716-446655440000',
    'Test T-Shirt',
    'A comfortable test t-shirt',
    mockCategories,
    true,
    new Date('2025-01-15T10:30:00Z'),
    new Date('2025-01-15T10:30:00Z'),
    [],
  );

  beforeEach(async () => {
    // Crear un nuevo mock para cada test
    productRepositoryMock = {
      createProduct: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        {
          provide: 'ProductRepository',
          useValue: productRepositoryMock,
        },
      ],
    }).compile();

    createProductUseCase =
      module.get<CreateProductUseCase>(CreateProductUseCase);
  });

  it('should create a product successfully', async () => {
    productRepositoryMock.createProduct.mockResolvedValue(mockProduct);

    const result = await createProductUseCase.execute(mockCreateProductDto);

    expect(result).toEqual(mockProduct);
    expect(productRepositoryMock.createProduct).toHaveBeenCalledWith(
      mockCreateProductDto,
    );
  });

  it('should propagate repository errors', async () => {
    const repositoryError = new Error('Database connection failed');
    productRepositoryMock.createProduct.mockRejectedValue(repositoryError);

    await expect(
      createProductUseCase.execute(mockCreateProductDto),
    ).rejects.toThrow('Database connection failed');
    expect(productRepositoryMock.createProduct).toHaveBeenCalledWith(
      mockCreateProductDto,
    );
  });

  describe('Business Rule Validations', () => {
    it('should throw error when product has no variations', async () => {
      const dtoWithoutVariations: CreateProductWithVariationsDto = {
        ...mockCreateProductDto,
        variations: [],
      };

      await expect(
        createProductUseCase.execute(dtoWithoutVariations),
      ).rejects.toThrow(BadRequestException);
      await expect(
        createProductUseCase.execute(dtoWithoutVariations),
      ).rejects.toThrow('Product must have at least one variation');
      expect(productRepositoryMock.createProduct).not.toHaveBeenCalled();
    });

    it('should throw error when variation has no items', async () => {
      const dtoWithEmptyVariation: CreateProductWithVariationsDto = {
        ...mockCreateProductDto,
        variations: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            items: [],
          },
        ],
      };

      await expect(
        createProductUseCase.execute(dtoWithEmptyVariation),
      ).rejects.toThrow(BadRequestException);
      await expect(
        createProductUseCase.execute(dtoWithEmptyVariation),
      ).rejects.toThrow('Each variation must have at least one item');
      expect(productRepositoryMock.createProduct).not.toHaveBeenCalled();
    });
  });
});
