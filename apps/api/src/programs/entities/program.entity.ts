import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// FIX 3: was `type ProgramStatus = 'scheduled' | ...` — promoted to enum so
// the compiler catches typos like 'canceld' and queries use ProgramStatus.CANCELLED
export enum ProgramStatus {
  SCHEDULED = 'scheduled',
  LIVE      = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'timestamp' })
  startTime!: Date;

  @Column({ type: 'timestamp' })
  endTime!: Date;

  // FIX 3: column now typed as the enum — TypeORM stores 'scheduled' etc. as before
  @Column({ type: 'enum', enum: ProgramStatus, default: ProgramStatus.SCHEDULED })
  status!: ProgramStatus;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'presenter_id' })
  presenter!: User;

  @Column({ name: 'presenter_id', nullable: true })
  presenterId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
