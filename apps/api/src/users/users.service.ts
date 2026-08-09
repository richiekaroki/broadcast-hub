import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from './enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  // FIX 1 (supports Fix 6): AuthService uses this instead of its own duplicate repo
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: {
    email: string;
    name: string;
    role?: UserRole;
    googleId?: string;
  }): Promise<User> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      role: dto.role ?? UserRole.VIEWER,
      googleId: dto.googleId,
    });
    return this.userRepo.save(user);
  }
}
