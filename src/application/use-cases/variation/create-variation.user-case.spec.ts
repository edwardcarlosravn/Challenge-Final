import { Test, TestingModule } from '@nestjs/testing';
import { CreateVariationUseCase } from './create-variation.user-case';
import { VariationRepository } from 'src/application/contracts/persistence/productVariation-repository.interface';
import { ProductVariation } from 'src/domain/variation';
import { CreateVariationDto } from 'src/application/dto/variation/create-variation.dto';

describe('CreateVariationUseCase', () => {
  let useCase: CreateVariationUseCase;
  let mockVariationRepository: jest.Mocked<VariationRepository>;

  beforeEach(async () => {
    mockVariationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVariationUseCase,
        {
          provide: 'VariationRepository',
          useValue: mockVariationRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateVariationUseCase>(CreateVariationUseCase);
  });

  describe('execute', () => {
    const validCreateVariationDto: CreateVariationDto = {
      productId: 'product-123',
      items: [
        {
          sku: 'SKU-001',
          price: 29.99,
          stock: 100,
          attributes: [{ attributeValueId: 1 }, { attributeValueId: 2 }],
        },
        {
          sku: 'SKU-002',
          price: 34.99,
          stock: 50,
          attributes: [{ attributeValueId: 3 }],
        },
      ],
    };

    const mockCreatedVariation = new ProductVariation(
      'variation-123',
      'product-123',
      true,
    );

    it('should successfully create a variation', async () => {
      mockVariationRepository.create.mockResolvedValue(mockCreatedVariation);

      const result = await useCase.execute(validCreateVariationDto);

      expect(mockVariationRepository.create).toHaveBeenCalledWith(
        validCreateVariationDto,
      );
      expect(result).toEqual(mockCreatedVariation);
    });

    it('should create variation with minimal data', async () => {
      const minimalDto: CreateVariationDto = {
        productId: 'product-456',
      };

      const mockMinimalVariation = new ProductVariation(
        'variation-456',
        'product-456',
        true,
      );

      mockVariationRepository.create.mockResolvedValue(mockMinimalVariation);

      const result = await useCase.execute(minimalDto);

      expect(mockVariationRepository.create).toHaveBeenCalledWith(minimalDto);
      expect(result).toEqual(mockMinimalVariation);
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database constraint violation');
      mockVariationRepository.create.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validCreateVariationDto)).rejects.toThrow(
        'Database constraint violation',
      );
      expect(mockVariationRepository.create).toHaveBeenCalledWith(
        validCreateVariationDto,
      );
    });
  });
});
