import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: {
    actorId: string;
    actorEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    meta?: Record<string, any>;
  }): Promise<void> {
    await this.auditRepo.save(this.auditRepo.create(data));
  }

  async findAll(limit = 50): Promise<AuditLog[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
