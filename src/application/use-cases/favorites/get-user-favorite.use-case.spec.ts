import { Test, TestingModule } from '@nestjs/testing';
import { GetUserFavoritesUseCase } from './get-user-favorites.use-case';
import { UserFavoriteRepository } from 'src/application/contracts/persistence/favorite-repository.interface';
import { UserFavorite } from 'src/domain/favorite';

describe('GetUserFavoritesUseCase', () => {
  let useCase: GetUserFavoritesUseCase;
  const mockRepository = {
    addFavorite: jest.fn(),
    getUserFavorites: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserFavoritesUseCase,
        {
          provide: 'UserFavoriteRepository',
          useValue: mockRepository as UserFavoriteRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserFavoritesUseCase>(GetUserFavoritesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user favorites from repository', async () => {
      const userId = 1;
      const expectedFavorites = [
        new UserFavorite(1, 1, 101, new Date()),
        new UserFavorite(2, 1, 102, new Date()),
      ];

      mockRepository.getUserFavorites.mockResolvedValue(expectedFavorites);

      const result = await useCase.execute(userId);

      expect(mockRepository.getUserFavorites).toHaveBeenCalledWith(userId);
      expect(mockRepository.getUserFavorites).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFavorites);
    });

    it('should return empty array when user has no favorites', async () => {
      const userId = 1;
      const expectedFavorites: UserFavorite[] = [];

      mockRepository.getUserFavorites.mockResolvedValue(expectedFavorites);

      const result = await useCase.execute(userId);

      expect(mockRepository.getUserFavorites).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate repository errors', async () => {
      const userId = 1;
      const error = new Error('Database connection failed');

      mockRepository.getUserFavorites.mockRejectedValue(error);

      await expect(useCase.execute(userId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockRepository.getUserFavorites).toHaveBeenCalledWith(userId);
    });
  });
});
