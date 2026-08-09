import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { Program, ProgramStatus } from './entities/program.entity';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makeProgram = (overrides: Partial<Program> = {}): Program => ({
  id:          'program-uuid-1',
  title:       'Evening News at 7',
  startTime:   new Date('2026-06-10T19:00:00Z'),
  endTime:     new Date('2026-06-10T20:00:00Z'),
  status:      ProgramStatus.SCHEDULED,
  presenterId: undefined,
  presenter:   null as unknown as Program['presenter'],
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

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('ProgramsService', () => {
  let service: ProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: getRepositoryToken(Program), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    jest.clearAllMocks();
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
    });

    it('throws BadRequestException when endTime <= startTime', async () => {
      await expect(
        service.create({
          title:     'Bad Program',
          startTime: '2026-06-10T20:00:00Z',
          endTime:   '2026-06-10T19:00:00Z',
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
    it('queries DB using ProgramStatus enum values', async () => {
      const programs = [makeProgram(), makeProgram({ status: ProgramStatus.LIVE })];
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

    it('applies pagination', async () => {
      const programs = Array.from({ length: 25 }, (_, i) => makeProgram({ id: `prog-${i}` }));
      mockRepo.find.mockResolvedValue(programs);

      const result = await service.findSchedule(1, 20);

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
          startTime: '2026-06-10T21:00:00Z',
          endTime:   '2026-06-10T20:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
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
