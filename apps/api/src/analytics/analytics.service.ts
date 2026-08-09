import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AnalyticsEvent } from './analytics-event.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  async getTodayViews(): Promise<number> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return this.repo.count({
      where: {
        action: 'view',
        createdAt: MoreThanOrEqual(start),
      },
    });
  }

  recordView(contentId: string, userId?: string): void {
    this.repo.save(
      this.repo.create({
        entityType: 'content',
        entityId: contentId,
        userId,
        action: 'view',
        meta: {},
      }),
    ).catch(err => this.logger.error('Analytics write failed', err));
  }
}
