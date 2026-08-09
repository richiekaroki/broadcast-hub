import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Content, ContentStatus } from '../content/entities/content.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { MemoryCache } from '../common/cache';

const cache = new MemoryCache();
const KEY = 'dashboard:stats';
const TTL = 300; // 5 minutes

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Content) private contentRepo: Repository<Content>,
    private analyticsService: AnalyticsService,
  ) {}

  async getStats() {
    const cached = cache.get<typeof stats>(KEY);
    if (cached) return { ...cached, cached: true };

    const [totalUsers, totalContent, publishedContent, todayViews] = await Promise.all([
      this.userRepo.count(), this.contentRepo.count(),
      this.contentRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.analyticsService.getTodayViews(),
    ]);
    const stats = { totalUsers, totalContent, publishedContent, todayViews };
    cache.set(KEY, stats, TTL);
    return { ...stats, cached: false };
  }
}
