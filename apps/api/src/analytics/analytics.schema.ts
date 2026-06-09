import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type AnalyticsDocument = AnalyticsEvent & Document;
@Schema({ timestamps: true, collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({ required: true, index: true }) entityType: 'content' | 'program' | 'advertisement';
  @Prop({ required: true, index: true }) entityId: string;
  @Prop({ index: true }) userId?: string;
  @Prop({ required: true }) action: 'view' | 'click' | 'share';
  @Prop({ type: Object, default: {} }) meta: Record<string, unknown>;
}
export const AnalyticsSchema = SchemaFactory.createForClass(AnalyticsEvent);
AnalyticsSchema.index({ entityId: 1, action: 1, createdAt: -1 });
