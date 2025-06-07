/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from './gql-jwt-auth.guard';

describe('GqlJwtAuthGuard', () => {
  let guard: GqlJwtAuthGuard;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockGqlExecutionContext: jest.Mocked<GqlExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GqlJwtAuthGuard],
    }).compile();

    guard = module.get<GqlJwtAuthGuard>(GqlJwtAuthGuard);

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guard instantiation', () => {
    it('should be defined', () => {
      // Assert
      expect(guard).toBeDefined();
    });

    it('should extend AuthGuard with jwt strategy', () => {
      // Assert
      expect(guard).toBeInstanceOf(GqlJwtAuthGuard);
      expect(guard.constructor.name).toBe('GqlJwtAuthGuard');
    });
  });

  describe('getRequest', () => {
    it('should extract request from GraphQL execution context', () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer token123',
        },
        user: {
          id: 1,
          email: 'test@example.com',
        },
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(result).toBe(mockRequest);
    });

    it('should handle request with authorization header', () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer jwt-token-here',
          'content-type': 'application/json',
        },
        method: 'POST',
        url: '/graphql',
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
      expect(result.headers).toEqual(mockRequest.headers);
    });

    it('should handle request without authorization header', () => {
      // Arrange
      const mockRequest = {
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        url: '/graphql',
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
      expect(result.headers).toEqual(mockRequest.headers);
    });

    it('should handle request with user already attached', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: 'admin',
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        user: mockUser,
        method: 'POST',
        url: '/graphql',
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
      expect((result as unknown as { user: typeof mockUser }).user).toEqual(
        mockUser,
      );
    });

    it('should handle empty request object', () => {
      // Arrange
      const mockRequest = {} as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
    });
  });

  describe('Context handling', () => {
    it('should properly create GqlExecutionContext from ExecutionContext', () => {
      // Arrange
      const mockRequest = {
        headers: { authorization: 'Bearer token' },
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      guard.getRequest(mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledTimes(1);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });

    it('should call getContext with correct type annotation', () => {
      // Arrange
      const mockRequest = {
        headers: { authorization: 'Bearer token' },
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      guard.getRequest(mockExecutionContext);

      // Assert
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalledTimes(1);
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalledWith();
    });

    it('should handle different execution context types', () => {
      // Arrange
      mockExecutionContext.getType.mockReturnValue('graphql');

      const mockRequest = {
        headers: { authorization: 'Bearer token' },
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error when GraphQL context is missing req property', () => {
      // Arrange
      const mockGraphqlContext = {} as { req: Request };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act & Assert
      expect(() => guard.getRequest(mockExecutionContext)).toThrow();
    });

    it('should throw error when GraphQL context req is null', () => {
      // Arrange
      const mockGraphqlContext = {
        req: null as unknown as Request,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act & Assert
      expect(() => guard.getRequest(mockExecutionContext)).toThrow();
    });

    it('should throw error when GraphQL context req is undefined', () => {
      // Arrange
      const mockGraphqlContext = {
        req: undefined as unknown as Request,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act & Assert
      expect(() => guard.getRequest(mockExecutionContext)).toThrow();
    });

    it('should handle when getContext returns undefined', () => {
      // Arrange
      mockGqlExecutionContext.getContext.mockReturnValue(undefined as any);

      // Act & Assert
      expect(() => guard.getRequest(mockExecutionContext)).toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with different request methods', () => {
      // Arrange
      const testCases = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      testCases.forEach((method) => {
        const mockRequest = {
          method,
          headers: { authorization: 'Bearer token' },
          url: '/graphql',
        } as unknown as Request;

        const mockGraphqlContext = {
          req: mockRequest,
        };

        mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

        // Act
        const result = guard.getRequest(mockExecutionContext);

        // Assert
        expect(result).toBe(mockRequest);
        expect((result as any).method).toBe(method);
      });
    });

    it('should preserve all request properties', () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer token123',
          'content-type': 'application/json',
          'user-agent': 'Test Agent',
        },
        method: 'POST',
        url: '/graphql',
        body: { query: 'query { users }' },
        ip: '127.0.0.1',
        params: {},
        query: {},
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toBe(mockRequest);
      expect(result).toEqual(mockRequest);
    });

    it('should handle complex authorization scenarios', () => {
      // Arrange
      const authorizationHeaders = [
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Bearer simple-token',
        'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        'Token abc123',
      ];

      authorizationHeaders.forEach((authHeader) => {
        const mockRequest = {
          headers: {
            authorization: authHeader,
          },
        } as unknown as Request;

        const mockGraphqlContext = {
          req: mockRequest,
        };

        mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

        // Act
        const result = guard.getRequest(mockExecutionContext);

        // Assert
        expect(result).toBe(mockRequest);
        expect((result as any).headers.authorization).toBe(authHeader);
      });
    });
  });

  describe('Type safety', () => {
    it('should return Request type', () => {
      // Arrange
      const mockRequest = {
        headers: { authorization: 'Bearer token' },
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(typeof result).toBe('object');
      expect(result).toBe(mockRequest);
    });

    it('should maintain Request interface properties', () => {
      // Arrange
      const mockRequest = {
        headers: { authorization: 'Bearer token' },
        method: 'POST',
        url: '/graphql',
      } as unknown as Request;

      const mockGraphqlContext = {
        req: mockRequest,
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.getRequest(mockExecutionContext);

      // Assert
      expect(result).toHaveProperty('headers');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('url');
    });
  });
});
