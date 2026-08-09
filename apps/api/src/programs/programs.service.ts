import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramStatus } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { MemoryCache } from '../common/cache';

const cache = new MemoryCache();
const SCHEDULE_KEY = 'programs:schedule';
const SCHEDULE_TTL = 120; // 2 minutes

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program) private programRepo: Repository<Program>,
  ) {}

  async create(dto: CreateProgramDto): Promise<Program> {
    const start = new Date(dto.startTime);
    const end   = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const program = this.programRepo.create({ ...dto, startTime: start, endTime: end });
    const saved = await this.programRepo.save(program);
    cache.del(SCHEDULE_KEY);
    return saved;
  }

  async findSchedule(page = 1, limit = 20): Promise<{ data: Program[]; total: number; page: number; limit: number }> {
    let all: Program[];

    const cached = cache.get<Program[]>(SCHEDULE_KEY);
    if (cached) {
      all = cached;
    } else {
      all = await this.programRepo.find({
        where: [{ status: ProgramStatus.SCHEDULED }, { status: ProgramStatus.LIVE }],
        order: { startTime: 'ASC' },
      });
      cache.set(SCHEDULE_KEY, all, SCHEDULE_TTL);
    }

    const start = (page - 1) * limit;
    const data  = all.slice(start, start + limit);
    return { data, total: all.length, page, limit };
  }

  async update(id: string, dto: UpdateProgramDto): Promise<Program> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');

    if (dto.title !== undefined) program.title = dto.title;
    if (dto.presenterId !== undefined) program.presenterId = dto.presenterId;

    const newStart = dto.startTime ? new Date(dto.startTime) : program.startTime;
    const newEnd   = dto.endTime   ? new Date(dto.endTime)   : program.endTime;
    if (newEnd <= newStart) {
      throw new BadRequestException('endTime must be after startTime');
    }
    program.startTime = newStart;
    program.endTime = newEnd;

    const saved = await this.programRepo.save(program);
    cache.del(SCHEDULE_KEY);
    return saved;
  }

  async cancel(id: string): Promise<Program> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    program.status = ProgramStatus.CANCELLED;
    const saved = await this.programRepo.save(program);
    cache.del(SCHEDULE_KEY);
    return saved;
  }
}
