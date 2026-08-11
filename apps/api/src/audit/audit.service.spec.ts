import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';

const mockRepo = {
  find:   jest.fn().mockResolvedValue([]),
  save:   jest.fn(),
  create: jest.fn(dto => dto),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log()', () => {
    it('creates and saves an audit log entry', async () => {
      await service.log({
        actorId: 'admin-1',
        actorEmail: 'admin@test.com',
        action: 'role_changed',
        targetType: 'user',
        targetId: 'user-1',
        meta: { oldRole: 'viewer', newRole: 'editor' },
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        actorId: 'admin-1',
        actorEmail: 'admin@test.com',
        action: 'role_changed',
        targetType: 'user',
        targetId: 'user-1',
        meta: { oldRole: 'viewer', newRole: 'editor' },
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('returns audit logs ordered by createdAt DESC', async () => {
      const logs = [{ id: '1', action: 'role_changed' }] as AuditLog[];
      mockRepo.find.mockResolvedValue(logs);

      const result = await service.findAll(10);

      expect(result).toEqual(logs);
      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });

    it('defaults limit to 50', async () => {
      await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });
});
