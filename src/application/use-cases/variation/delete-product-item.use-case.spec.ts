import { Test, TestingModule } from '@nestjs/testing';
import { DeleteProductItemUseCase } from './delete-product-item.use-case';
import { ProductItemRepository } from 'src/application/contracts/persistence/productItem-repository.interface';
import { ProductItem } from 'src/domain/product-item';

describe('DeleteProductItemUseCase', () => {
  let useCase: DeleteProductItemUseCase;
  let mockProductItemRepository: jest.Mocked<ProductItemRepository>;

  const mockProductItem = new ProductItem(
    1,
    'var-123',
    'TSHIRT-M-RED',
    29.99,
    100,
    [{ attributeValueId: 1 }],
  );

  beforeEach(async () => {
    mockProductItemRepository = {
      findById: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductItemUseCase,
        {
          provide: 'ProductItemRepository',
          useValue: mockProductItemRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteProductItemUseCase>(DeleteProductItemUseCase);
  });

  describe('execute', () => {
    it('should delete product item successfully', async () => {
      mockProductItemRepository.findById.mockResolvedValue(mockProductItem);
      mockProductItemRepository.deleteById.mockResolvedValue();

      await useCase.execute(1);

      expect(mockProductItemRepository.findById).toHaveBeenCalledWith(1);
      expect(mockProductItemRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('should throw error for invalid IDs', async () => {
      const invalidIds = [0, -1];

      for (const invalidId of invalidIds) {
        await expect(useCase.execute(invalidId)).rejects.toThrow(
          'Valid ProductItem ID is required',
        );
      }

      await expect(useCase.execute(null as any)).rejects.toThrow(
        'Valid ProductItem ID is required',
      );
      await expect(useCase.execute(undefined as any)).rejects.toThrow(
        'Valid ProductItem ID is required',
      );

      expect(mockProductItemRepository.findById).not.toHaveBeenCalled();
      expect(mockProductItemRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw error when product item does not exist', async () => {
      mockProductItemRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(
        'ProductItem with ID 999 not found',
      );
      expect(mockProductItemRepository.findById).toHaveBeenCalledWith(999);
      expect(mockProductItemRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockProductItemRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(1)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockProductItemRepository.findById).toHaveBeenCalledWith(1);
      expect(mockProductItemRepository.deleteById).not.toHaveBeenCalled();
    });
  });
});
