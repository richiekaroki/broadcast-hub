import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  entityType!: 'content' | 'program' | 'advertisement';

  @Column()
  @Index()
  entityId!: string;

  @Column({ nullable: true })
  @Index()
  userId?: string;

  @Column()
  action!: 'view' | 'click' | 'share';

  @Column({ type: 'jsonb', default: () => "'{}'" })
  meta!: Record<string, unknown>;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
