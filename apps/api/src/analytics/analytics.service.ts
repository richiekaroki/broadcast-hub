import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsDocument } from './analytics.schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly model: Model<AnalyticsDocument>,
  ) {}

  async getTodayViews(): Promise<number> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return this.model.countDocuments({
      action: 'view',
      createdAt: { $gte: start },
    }).exec();
  }

  // FIX 3: fire-and-forget with explicit error logging — errors never silently vanish
  recordView(contentId: string, userId?: string): void {
    this.model
      .create({
        entityType: 'content',
        entityId: contentId,
        userId,
        action: 'view',
        meta: {},
      })
      .catch(err => this.logger.error('Analytics write failed', err));
  }
}
