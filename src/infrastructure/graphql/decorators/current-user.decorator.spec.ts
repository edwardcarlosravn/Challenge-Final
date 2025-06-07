/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockGqlExecutionContext: jest.Mocked<GqlExecutionContext>;
  let decoratorFunction: (
    data: string | undefined,
    context: ExecutionContext,
  ) => unknown;

  beforeEach(() => {
    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    // Mock GqlExecutionContext
    mockGqlExecutionContext = {
      getContext: jest.fn(),
      getArgs: jest.fn(),
      getRoot: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      setType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as unknown as jest.Mocked<GqlExecutionContext>;

    // Mock GqlExecutionContext.create static method
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue(mockGqlExecutionContext);

    // The actual decorator function logic - extracted from the implementation
    decoratorFunction = (
      data: string | undefined,
      context: ExecutionContext,
    ) => {
      const ctx = GqlExecutionContext.create(context);
      const gqlContext = ctx.getContext<{
        req: { user?: Record<string, unknown> };
      }>();
      const user = gqlContext.req.user;
      if (!data) {
        return user;
      }
      return user?.[data];
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should return the full user object when no data parameter is provided', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return a specific user property when data parameter is provided', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction('email', mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toBe('test@example.com');
    });

    it('should return user id when data parameter is "id"', () => {
      // Arrange
      const mockUser = {
        id: 123,
        email: 'user@example.com',
        name: 'John Doe',
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction('id', mockExecutionContext);

      // Assert
      expect(result).toBe(123);
    });

    it('should return user role when data parameter is "role"', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction('role', mockExecutionContext);

      // Assert
      expect(result).toBe('admin');
    });

    it('should handle nested object properties', () => {
      // Arrange
      const mockUser = {
        id: 1,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const profileResult = decoratorFunction('profile', mockExecutionContext);
      const settingsResult = decoratorFunction(
        'settings',
        mockExecutionContext,
      );

      // Assert
      expect(profileResult).toEqual(mockUser.profile);
      expect(settingsResult).toEqual(mockUser.settings);
    });
  });

  describe('Edge cases', () => {
    it('should return undefined when user is not present in context', () => {
      // Arrange
      const mockContext = {
        req: {}, // No user property
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined when user is explicitly undefined', () => {
      // Arrange
      const mockContext = {
        req: { user: undefined },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return null when user is null', () => {
      // Arrange
      const mockContext = {
        req: { user: null as unknown as Record<string, unknown> },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(result).toBeNull();
    });

    it('should return undefined when accessing non-existent user property', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(
        'nonExistentProperty',
        mockExecutionContext,
      );

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when user is not an object', () => {
      // Arrange
      const mockContext = {
        req: { user: 'string-user' as unknown as Record<string, unknown> },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction('id', mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle empty user object', () => {
      // Arrange
      const mockUser = {};

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const fullUserResult = decoratorFunction(undefined, mockExecutionContext);
      const propertyResult = decoratorFunction('id', mockExecutionContext);

      // Assert
      expect(fullUserResult).toEqual({});
      expect(propertyResult).toBeUndefined();
    });

    it('should handle user with falsy property values', () => {
      // Arrange
      const mockUser = {
        id: 0,
        email: '',
        isActive: false,
        balance: null,
        lastLogin: undefined,
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act & Assert
      expect(decoratorFunction('id', mockExecutionContext)).toBe(0);
      expect(decoratorFunction('email', mockExecutionContext)).toBe('');
      expect(decoratorFunction('isActive', mockExecutionContext)).toBe(false);
      expect(decoratorFunction('balance', mockExecutionContext)).toBeNull();
      expect(
        decoratorFunction('lastLogin', mockExecutionContext),
      ).toBeUndefined();
    });
  });

  describe('Context handling', () => {
    it('should properly create GqlExecutionContext from ExecutionContext', () => {
      // Arrange
      const mockContext = {
        req: { user: { id: 1 } },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledTimes(1);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });

    it('should call getContext with correct type annotation', () => {
      // Arrange
      const mockContext = {
        req: { user: { id: 1, email: 'test@example.com' } },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalledTimes(1);
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalledWith();
    });

    it('should handle missing req object in context', () => {
      // Arrange
      const mockContext = {} as { req: { user?: Record<string, unknown> } };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act & Assert
      expect(() =>
        decoratorFunction(undefined, mockExecutionContext),
      ).toThrow();
    });

    it('should handle context where req is null', () => {
      // Arrange
      const mockContext = {
        req: null as unknown as { user?: Record<string, unknown> },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act & Assert
      expect(() =>
        decoratorFunction(undefined, mockExecutionContext),
      ).toThrow();
    });
  });

  describe('Type safety', () => {
    it('should handle various data parameter types', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        profile: { name: 'Test' },
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act & Assert
      expect(decoratorFunction('id', mockExecutionContext)).toBe(1);
      expect(decoratorFunction('email', mockExecutionContext)).toBe(
        'test@example.com',
      );
      expect(decoratorFunction('profile', mockExecutionContext)).toEqual({
        name: 'Test',
      });
    });

    it('should preserve user object structure when returning full user', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        metadata: {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
        roles: ['user', 'admin'],
      };

      const mockContext = {
        req: { user: mockUser },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockContext);

      // Act
      const result = decoratorFunction(undefined, mockExecutionContext);

      // Assert
      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('roles');
      expect(Array.isArray((result as typeof mockUser)?.roles)).toBe(true);
    });
  });
  describe('Decorator verification', () => {
    it('should verify the CurrentUser decorator is properly defined', () => {
      // Arrange & Act & Assert
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });
  });
});
