import {
  Injectable, UnauthorizedException, ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: UserRole.VIEWER,
    });
    return this.generateTokens(user);
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash ?? '');
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  async findOrCreateOAuthUser(data: {
    email: string; name: string; googleId: string;
  }) {
    let user = await this.usersService.findByEmail(data.email);
    if (!user) {
      user = await this.usersService.create({
        email:        data.email,
        name:         data.name,
        passwordHash: '',
        role:         UserRole.VIEWER,
        googleId:     data.googleId,
      });
    }
    return user;
  }

  // ── Token generation (two separate secrets) ──────────────────────────────────
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, rawRefresh] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:    this.config.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret:    this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
        audience:  'refresh',
      }),
    ]);

    // Persist hashed refresh token for revocation support
    await this.storeRefreshToken(user.id, rawRefresh);

    return { accessToken, refreshToken: rawRefresh };
  }

  // ── Refresh (rotate token) ───────────────────────────────────────────────────
  async refreshTokens(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify signature + expiry against refresh secret
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(rawToken, {
        secret:   this.config.get<string>('JWT_REFRESH_SECRET'),
        audience: 'refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Find matching stored token by userId
    const stored = await this.findStoredToken(payload.sub, rawToken);
    if (!stored || stored.isExpired) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // 3. Delete old token (rotation — one-time use)
    await this.refreshRepo.delete(stored.id);

    // 4. Load user and issue new pair
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateTokens(user);
  }

  // ── Logout (revoke refresh token) ────────────────────────────────────────────
  async logout(userId: string, rawToken: string): Promise<void> {
    const stored = await this.findStoredToken(userId, rawToken);
    if (stored) await this.refreshRepo.delete(stored.id);
    // Silently succeed even if token not found — idempotent
  }

  // ── Private helpers ───────────────────────────────────────────────────────────
  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, 8); // cost 8 — it's a token not a password
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up old tokens for this user (keep at most 5 active sessions)
    const existing = await this.refreshRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
    if (existing.length >= 5) {
      await this.refreshRepo.delete(existing[0].id);
    }

    await this.refreshRepo.save(this.refreshRepo.create({ userId, tokenHash, expiresAt }));
  }

  private async findStoredToken(userId: string, rawToken: string): Promise<RefreshToken | null> {
    const tokens = await this.refreshRepo.find({ where: { userId } });
    for (const t of tokens) {
      const match = await bcrypt.compare(rawToken, t.tokenHash);
      if (match) return t;
    }
    return null;
  }
}
