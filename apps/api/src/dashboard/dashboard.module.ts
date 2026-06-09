import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Content } from '../content/entities/content.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
@Module({
  imports: [TypeOrmModule.forFeature([User, Content]), AnalyticsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
