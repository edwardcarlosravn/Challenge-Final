import { Test, TestingModule } from '@nestjs/testing';
import { AddFavoriteUseCase } from './add-favorite.use-case';
import { UserFavoriteRepository } from 'src/application/contracts/persistence/favorite-repository.interface';
import { UserFavorite } from 'src/domain/favorite';
import { AddFavoriteDto } from 'src/application/dto/favorites/add-favorite.dto';

describe('AddFavoriteUseCase', () => {
  let useCase: AddFavoriteUseCase;
  const mockUserFavoriteRepository = {
    addFavorite: jest.fn(),
    getUserFavorites: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddFavoriteUseCase,
        {
          provide: 'UserFavoriteRepository',
          useValue: mockUserFavoriteRepository as UserFavoriteRepository,
        },
      ],
    }).compile();

    useCase = module.get<AddFavoriteUseCase>(AddFavoriteUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validDto: AddFavoriteDto = {
      userId: 1,
      productItemId: 101,
    };

    const mockUserFavorite = new UserFavorite(
      1,
      1,
      101,
      new Date('2025-06-04T10:00:00Z'),
    );

    it('should successfully add a favorite', async () => {
      mockUserFavoriteRepository.addFavorite.mockResolvedValue(
        mockUserFavorite,
      );

      const result = await useCase.execute(validDto);

      expect(result).toEqual(mockUserFavorite);
      expect(mockUserFavoriteRepository.addFavorite).toHaveBeenCalledWith(
        validDto,
      );
      expect(mockUserFavoriteRepository.addFavorite).toHaveBeenCalledTimes(1);
    });
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockUserFavoriteRepository.addFavorite.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserFavoriteRepository.addFavorite).toHaveBeenCalledWith(
        validDto,
      );
    });

    it('should not modify input parameters', async () => {
      const originalDto: AddFavoriteDto = {
        userId: 42,
        productItemId: 999,
      };

      const originalValues = { ...originalDto };

      mockUserFavoriteRepository.addFavorite.mockResolvedValue(
        mockUserFavorite,
      );

      await useCase.execute(originalDto);

      expect(originalDto).toEqual(originalValues);
      expect(originalDto.userId).toBe(42);
      expect(originalDto.productItemId).toBe(999);
    });

    it('should handle concurrent favorite additions', async () => {
      const dto1: AddFavoriteDto = { userId: 1, productItemId: 101 };
      const dto2: AddFavoriteDto = { userId: 1, productItemId: 102 };

      const favorite1 = new UserFavorite(10, 1, 101, new Date());
      const favorite2 = new UserFavorite(11, 1, 102, new Date());

      mockUserFavoriteRepository.addFavorite
        .mockResolvedValueOnce(favorite1)
        .mockResolvedValueOnce(favorite2);

      const [result1, result2] = await Promise.all([
        useCase.execute(dto1),
        useCase.execute(dto2),
      ]);

      expect(result1).toEqual(favorite1);
      expect(result2).toEqual(favorite2);
      expect(mockUserFavoriteRepository.addFavorite).toHaveBeenCalledTimes(2);
    });
  });
});
