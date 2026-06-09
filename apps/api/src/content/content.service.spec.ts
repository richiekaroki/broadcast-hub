import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getRedisToken } from '@nestjs-modules/ioredis';
import { ContentService } from './content.service';
import { Content, ContentStatus } from './entities/content.entity';
import { UserRole } from '../users/enums/user-role.enum';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockContent: Content = {
  id:              'content-uuid-1',
  title:           'Evening News',
  body:            'Top stories from Kenya.',
  status:          ContentStatus.DRAFT,
  authorId:        'user-uuid-1',
  author:          null as any,
  rejectionReason: null,
  createdAt:       new Date(),
  updatedAt:       new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockRepo = {
  create:   jest.fn(),
  save:     jest.fn(),
  find:     jest.fn(),
  findOne:  jest.fn(),
  delete:   jest.fn(),
};

const mockRedis = {
  get:    jest.fn().mockResolvedValue(null), // cache miss by default
  setex:  jest.fn().mockResolvedValue('OK'),
  del:    jest.fn().mockResolvedValue(1),
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('ContentService', () => {
  let service: ContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: getRepositoryToken(Content), useValue: mockRepo  },
        { provide: getRedisToken(),             useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
  });

  // ── create ────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('always forces status to DRAFT regardless of input', async () => {
      mockRepo.create.mockReturnValue({ ...mockContent, status: ContentStatus.DRAFT });
      mockRepo.save.mockResolvedValue({ ...mockContent, status: ContentStatus.DRAFT });

      const result = await service.create(
        { title: 'Test', body: 'Body' },
        'user-uuid-1',
      );

      expect(result.status).toBe(ContentStatus.DRAFT);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ContentStatus.DRAFT, authorId: 'user-uuid-1' }),
      );
    });

    it('sets authorId from the calling user', async () => {
      mockRepo.create.mockReturnValue(mockContent);
      mockRepo.save.mockResolvedValue(mockContent);

      await service.create({ title: 'T', body: 'B' }, 'user-uuid-42');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorId: 'user-uuid-42' }),
      );
    });

    it('invalidates the Redis cache after creation', async () => {
      mockRepo.create.mockReturnValue(mockContent);
      mockRepo.save.mockResolvedValue(mockContent);

      await service.create({ title: 'T', body: 'B' }, 'user-uuid-1');

      expect(mockRedis.del).toHaveBeenCalledWith('content:list');
    });
  });

  // ── findPublished ─────────────────────────────────────────────────────────────
  describe('findPublished()', () => {
    it('returns cached result without hitting the DB on cache hit', async () => {
      const cached = [{ ...mockContent, status: ContentStatus.PUBLISHED }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findPublished();

      expect(result).toHaveLength(1);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('queries DB and caches result on cache miss', async () => {
      const published = [{ ...mockContent, status: ContentStatus.PUBLISHED }];
      mockRedis.get.mockResolvedValue(null);
      mockRepo.find.mockResolvedValue(published);

      const result = await service.findPublished();

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: ContentStatus.PUBLISHED } }),
      );
      expect(mockRedis.setex).toHaveBeenCalledWith('content:list', 300, expect.any(String));
      expect(result).toHaveLength(1);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', UserRole.VIEWER),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns content for SUPER_ADMIN even if not published', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockContent, status: ContentStatus.DRAFT });

      const result = await service.findOne(mockContent.id, UserRole.SUPER_ADMIN);

      expect(result.status).toBe(ContentStatus.DRAFT);
    });

    it('throws NotFoundException for VIEWER accessing non-published content', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockContent, status: ContentStatus.DRAFT });

      await expect(
        service.findOne(mockContent.id, UserRole.VIEWER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── workflow transitions ──────────────────────────────────────────────────────
  describe('submitForReview()', () => {
    it('transitions DRAFT → PENDING_REVIEW', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockContent });
      mockRepo.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.submitForReview(mockContent.id);

      expect(result.status).toBe(ContentStatus.PENDING_REVIEW);
    });
  });

  describe('publish()', () => {
    it('transitions any status → PUBLISHED and invalidates cache', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockContent, status: ContentStatus.PENDING_REVIEW });
      mockRepo.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.publish(mockContent.id);

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(mockRedis.del).toHaveBeenCalledWith('content:list');
    });
  });

  describe('reject()', () => {
    it('sets status to REJECTED and stores rejectionReason (no "as any" cast)', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockContent });
      mockRepo.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.reject(mockContent.id, 'Factual errors');

      expect(result.status).toBe(ContentStatus.REJECTED);
      expect(result.rejectionReason).toBe('Factual errors');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('throws NotFoundException when nothing deleted', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('invalidates cache after successful deletion', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockContent.id);

      expect(mockRedis.del).toHaveBeenCalledWith('content:list');
    });
  });
});
