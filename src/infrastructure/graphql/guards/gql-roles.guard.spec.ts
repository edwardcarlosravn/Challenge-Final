/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlRolesGuard } from './gql-roles.guard';
import { Role } from '../../http/enums/auth/role.enums';
import { ROLES_KEY } from '../../http/decorators/auth/roles.decorators';

describe('GqlRolesGuard', () => {
  let guard: GqlRolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockGqlExecutionContext: jest.Mocked<GqlExecutionContext>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GqlRolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<GqlRolesGuard>(GqlRolesGuard);
    reflector = module.get(Reflector);

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

  describe('canActivate', () => {
    it('should allow access if no roles are defined', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(null);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access if roles array is empty', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue([]);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw BadRequestException if user is not found', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const mockGraphqlContext = {
        req: {
          user: undefined,
        },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        BadRequestException,
      );
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have a valid role', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: Role.CLIENT,
      };

      const mockGraphqlContext = {
        req: {
          user: mockUser,
        },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
    });

    it('should allow access if user has a valid role', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.EDITOR]);

      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      const mockGraphqlContext = {
        req: {
          user: mockUser,
        },
      };

      mockGqlExecutionContext.getContext.mockReturnValue(mockGraphqlContext);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(
        mockExecutionContext,
      );
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });
});
