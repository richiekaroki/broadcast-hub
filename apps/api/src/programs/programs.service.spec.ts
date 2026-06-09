import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getRedisToken } from '@nestjs-modules/ioredis';
import { ProgramsService } from './programs.service';
import { Program, ProgramStatus } from './entities/program.entity';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makeProgram = (overrides: Partial<Program> = {}): Program => ({
  id:          'program-uuid-1',
  title:       'Evening News at 7',
  startTime:   new Date('2026-06-10T19:00:00Z'),
  endTime:     new Date('2026-06-10T20:00:00Z'),
  status:      ProgramStatus.SCHEDULED,
  presenterId: null,
  presenter:   null as any,
  createdAt:   new Date(),
  updatedAt:   new Date(),
  ...overrides,
});

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockRepo = {
  create:  jest.fn(),
  save:    jest.fn(),
  find:    jest.fn(),
  findOne: jest.fn(),
};

const mockRedis = {
  get:   jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  del:   jest.fn().mockResolvedValue(1),
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('ProgramsService', () => {
  let service: ProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: getRepositoryToken(Program), useValue: mockRepo  },
        { provide: getRedisToken(),             useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
  });

  // ── create ────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('creates a program with valid time range', async () => {
      const prog = makeProgram();
      mockRepo.create.mockReturnValue(prog);
      mockRepo.save.mockResolvedValue(prog);

      const result = await service.create({
        title:     'Evening News at 7',
        startTime: '2026-06-10T19:00:00Z',
        endTime:   '2026-06-10T20:00:00Z',
      });

      expect(result.title).toBe('Evening News at 7');
      expect(mockRedis.del).toHaveBeenCalledWith('programs:schedule');
    });

    it('throws BadRequestException when endTime <= startTime', async () => {
      await expect(
        service.create({
          title:     'Bad Program',
          startTime: '2026-06-10T20:00:00Z',
          endTime:   '2026-06-10T19:00:00Z', // end BEFORE start
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when endTime equals startTime', async () => {
      await expect(
        service.create({
          title:     'Zero Duration',
          startTime: '2026-06-10T19:00:00Z',
          endTime:   '2026-06-10T19:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findSchedule ──────────────────────────────────────────────────────────────
  describe('findSchedule()', () => {
    it('returns cached schedule without hitting DB on warm cache', async () => {
      const cached = [makeProgram()];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findSchedule();

      expect(result.data).toHaveLength(1);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('queries DB using ProgramStatus enum values (not raw strings)', async () => {
      const programs = [makeProgram(), makeProgram({ status: ProgramStatus.LIVE })];
      mockRedis.get.mockResolvedValue(null);
      mockRepo.find.mockResolvedValue(programs);

      await service.findSchedule();

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            { status: ProgramStatus.SCHEDULED },
            { status: ProgramStatus.LIVE },
          ]),
        }),
      );
    });

    it('caches result and applies pagination', async () => {
      const programs = Array.from({ length: 25 }, (_, i) => makeProgram({ id: `prog-${i}` }));
      mockRepo.find.mockResolvedValue(programs);

      const result = await service.findSchedule(1, 20);

      expect(mockRedis.setex).toHaveBeenCalledWith('programs:schedule', 120, expect.any(String));
      expect(result.data).toHaveLength(20);
      expect(result.total).toBe(25);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('throws NotFoundException for unknown program id', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when updated times are invalid', async () => {
      mockRepo.findOne.mockResolvedValue(makeProgram());

      await expect(
        service.update('program-uuid-1', {
          startTime: new Date('2026-06-10T21:00:00Z'),
          endTime:   new Date('2026-06-10T20:00:00Z'), // end before start
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('invalidates cache after successful update', async () => {
      const prog = makeProgram();
      mockRepo.findOne.mockResolvedValue(prog);
      mockRepo.save.mockResolvedValue({ ...prog, title: 'Updated' });

      await service.update('program-uuid-1', { title: 'Updated' });

      expect(mockRedis.del).toHaveBeenCalledWith('programs:schedule');
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────────
  describe('cancel()', () => {
    it('sets status to ProgramStatus.CANCELLED using enum value', async () => {
      const prog = makeProgram();
      mockRepo.findOne.mockResolvedValue(prog);
      mockRepo.save.mockImplementation(p => Promise.resolve(p));

      const result = await service.cancel('program-uuid-1');

      expect(result.status).toBe(ProgramStatus.CANCELLED);
    });
  });
});
