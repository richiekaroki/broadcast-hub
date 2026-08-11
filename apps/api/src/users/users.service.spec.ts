import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

const mockUser: User = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  role: UserRole.VIEWER,
  googleId: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  find:   jest.fn().mockResolvedValue([mockUser]),
  findOne: jest.fn().mockResolvedValue(mockUser),
  save:    jest.fn().mockImplementation(u => Promise.resolve(u)),
  create:  jest.fn(dto => dto),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail()', () => {
    it('returns user when found', async () => {
      const result = await service.findByEmail('user@test.com');
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('missing@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('returns user when found', async () => {
      const result = await service.findById('user-1');
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findById('missing-id');
      expect(result).toBeNull();
    });
  });

  describe('findOne()', () => {
    it('returns user when found', async () => {
      const result = await service.findOne('user-1');
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('creates a new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        email: 'new@test.com',
        name: 'New User',
        role: UserRole.EDITOR,
      });
      expect(result).toHaveProperty('email', 'new@test.com');
      expect(result).toHaveProperty('role', UserRole.EDITOR);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('defaults to VIEWER role', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        email: 'new@test.com',
        name: 'New User',
      });
      expect(result).toHaveProperty('role', UserRole.VIEWER);
    });

    it('throws ConflictException when email exists', async () => {
      await expect(service.create({
        email: 'user@test.com',
        name: 'Duplicate',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile()', () => {
    it('updates user name', async () => {
      const result = await service.updateProfile('user-1', { name: 'Updated Name' });
      expect(result).toHaveProperty('name', 'Updated Name');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('returns all users', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('updateRole()', () => {
    it('updates user role', async () => {
      const result = await service.updateRole('user-1', UserRole.EDITOR);
      expect(result).toHaveProperty('role', UserRole.EDITOR);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updateRole('missing-id', UserRole.EDITOR)).rejects.toThrow(NotFoundException);
    });
  });
});
