import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from './get-product.use-case';
import { ProductRepository } from 'src/application/contracts/persistence/product-repository.interface';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {
          provide: 'ProductRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
    mockProductRepository = module.get('ProductRepository');
  });

  it('should call repository with default pagination when no request provided', async () => {
    const mockResult = {
      data: [],
      metadata: { someField: 'someValue' },
    };
    mockProductRepository.findAll.mockResolvedValue(mockResult as any);

    const result = await useCase.execute();

    // ASSERT
    expect(mockProductRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    // ASSERT
    expect(result).toEqual(mockResult);
  });
});
