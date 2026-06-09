import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { User } from '../users/entities/user.entity';
import { Content, ContentStatus } from '../content/entities/content.entity';
import { AnalyticsService } from '../analytics/analytics.service';
const KEY = 'dashboard:stats'; const TTL = 300;
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Content) private contentRepo: Repository<Content>,
    @InjectRedis() private redis: Redis,
    private analyticsService: AnalyticsService,
  ) {}
  async getStats() {
    const cached = await this.redis.get(KEY);
    if (cached) return { ...JSON.parse(cached), cached: true };
    const [totalUsers, totalContent, publishedContent, todayViews] = await Promise.all([
      this.userRepo.count(), this.contentRepo.count(),
      this.contentRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.analyticsService.getTodayViews(),
    ]);
    const stats = { totalUsers, totalContent, publishedContent, todayViews };
    await this.redis.setex(KEY, TTL, JSON.stringify(stats));
    return { ...stats, cached: false };
  }
}
