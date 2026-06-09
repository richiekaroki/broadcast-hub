import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // FIX 1: name column added — RegisterDto already collects it but it was silently dropped
  @Column()
  name: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  // FIX 5 (partial): googleId stored so OAuth re-logins match on provider ID, not just email
  @Column({ nullable: true })
  googleId?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
