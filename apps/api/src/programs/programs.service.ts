import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Program, ProgramStatus } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';

const SCHEDULE_KEY = 'programs:schedule';
const SCHEDULE_TTL = 120; // 2 minutes

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program) private programRepo: Repository<Program>,
    @InjectRedis() private redis: Redis,
  ) {}

  async create(dto: CreateProgramDto): Promise<Program> {
    const start = new Date(dto.startTime);
    const end   = new Date(dto.endTime);

    // FIX 8: reject invalid time ranges
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const program = this.programRepo.create({ ...dto, startTime: start, endTime: end });
    const saved = await this.programRepo.save(program);
    await this.redis.del(SCHEDULE_KEY);
    return saved;
  }

  // FIX 9: page/limit pagination — cache stores the full list, slice in memory
  // This is efficient at broadcast-hub scale (schedules rarely exceed a few hundred rows)
  async findSchedule(page = 1, limit = 20): Promise<{ data: Program[]; total: number; page: number; limit: number }> {
    const cacheKey = SCHEDULE_KEY; // cache the full active schedule list
    let all: Program[];

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      all = JSON.parse(cached);
    } else {
      // FIX 3: enum values in query
      all = await this.programRepo.find({
        where: [{ status: ProgramStatus.SCHEDULED }, { status: ProgramStatus.LIVE }],
        order: { startTime: 'ASC' },
      });
      await this.redis.setex(cacheKey, SCHEDULE_TTL, JSON.stringify(all));
    }

    const start = (page - 1) * limit;
    const data  = all.slice(start, start + limit);
    return { data, total: all.length, page, limit };
  }

  async update(id: string, data: Partial<Program>): Promise<Program> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');

    // FIX 8: validate times on update too
    const newStart = data.startTime ?? program.startTime;
    const newEnd   = data.endTime   ?? program.endTime;
    if (new Date(newEnd) <= new Date(newStart)) {
      throw new BadRequestException('endTime must be after startTime');
    }

    Object.assign(program, data);
    const saved = await this.programRepo.save(program);
    await this.redis.del(SCHEDULE_KEY);
    return saved;
  }

  // FIX 3: enum value
  async cancel(id: string): Promise<Program> {
    return this.update(id, { status: ProgramStatus.CANCELLED });
  }
}
