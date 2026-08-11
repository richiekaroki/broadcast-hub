import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';

function mockContext(user?: { role: string }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(null) };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.EDITOR, UserRole.SUPER_ADMIN]);
    const ctx = mockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user has a different role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('denies access when user is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    const ctx = mockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when roles decorator returns empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
