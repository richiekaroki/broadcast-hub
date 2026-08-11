import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from './enums/user-role.enum';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

const mockUser = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  role: UserRole.VIEWER,
  createdAt: new Date(),
};

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@test.com',
};

const mockUsersService = {
  findOne:      jest.fn().mockResolvedValue(mockUser),
  findAll:      jest.fn().mockResolvedValue([mockUser]),
  updateProfile: jest.fn().mockImplementation((id, dto) =>
    Promise.resolve({ ...mockUser, ...dto }),
  ),
  updateRole:   jest.fn().mockImplementation((id, role) =>
    Promise.resolve({ ...mockUser, role }),
  ),
};

const mockAuditService = {
  log:      jest.fn().mockResolvedValue(undefined),
  findAll:  jest.fn().mockResolvedValue([]),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService,  useValue: mockUsersService },
        { provide: AuditService,  useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile()', () => {
    it('returns the current user profile', async () => {
      const result = await controller.getProfile({ id: 'user-1' });
      expect(result).toHaveProperty('id', 'user-1');
      expect(result).toHaveProperty('email', 'user@test.com');
    });
  });

  describe('updateProfile()', () => {
    it('updates user name', async () => {
      const result = await controller.updateProfile({ id: 'user-1' }, { name: 'New Name' });
      expect(result).toHaveProperty('name', 'New Name');
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-1', { name: 'New Name' });
    });
  });

  describe('listUsers()', () => {
    it('returns all users', async () => {
      const result = await controller.listUsers();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'user-1');
    });
  });

  describe('changeRole()', () => {
    it('updates the target user role and logs audit', async () => {
      const result = await controller.changeRole(mockAdmin, 'user-1', { role: UserRole.EDITOR });
      expect(result).toHaveProperty('role', UserRole.EDITOR);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'role_changed', targetId: 'user-1' }),
      );
    });

    it('throws ForbiddenException when admin tries to change own role', async () => {
      await expect(
        controller.changeRole({ ...mockAdmin, id: 'user-1' }, 'user-1', { role: UserRole.EDITOR }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when role is already the same', async () => {
      await expect(
        controller.changeRole(mockAdmin, 'user-1', { role: UserRole.VIEWER }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAuditLogs()', () => {
    it('returns audit logs', async () => {
      const result = await controller.getAuditLogs();
      expect(result).toEqual([]);
      expect(mockAuditService.findAll).toHaveBeenCalledWith(100);
    });
  });
});
