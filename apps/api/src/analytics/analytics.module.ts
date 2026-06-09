import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent, AnalyticsSchema } from './analytics.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: AnalyticsEvent.name, schema: AnalyticsSchema }])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
