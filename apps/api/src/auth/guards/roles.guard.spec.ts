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
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR, UserRole.SUPER_ADMIN]);
    const ctx = mockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user has a different role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('denies access when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
    const ctx = mockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows access when roles decorator returns empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = mockContext({ role: UserRole.VIEWER });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
