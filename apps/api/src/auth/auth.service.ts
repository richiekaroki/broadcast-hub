import {
  Injectable, UnauthorizedException, ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { MagicLinkToken } from './magic-link-token.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(MagicLinkToken)
    private readonly magicLinkRepo: Repository<MagicLinkToken>,
  ) {}

  // ── Request magic link ──────────────────────────────────────────────────────
  async requestMagicLink(email: string): Promise<{ message: string }> {
    // Always return success to prevent email enumeration
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Silently succeed — don't reveal whether email exists
      return { message: 'If an account exists, a magic link has been sent' };
    }

    // Invalidate any previous unused tokens for this user
    await this.magicLinkRepo.update(
      { userId: user.id, used: false },
      { used: true },
    );

    // Generate a secure random token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.magicLinkRepo.save(
      this.magicLinkRepo.create({ token: tokenHash, userId: user.id, expiresAt }),
    );

    // Build the verification URL
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/auth/verify?token=${rawToken}`;

    // Send the magic link email
    try {
      await this.emailService.sendMagicLink(email, rawToken);
    } catch (err) {
      this.logger.error(`Failed to send magic link email to ${email}`, err);
      // Don't reveal email failure to user
    }

    return { message: 'If an account exists, a magic link has been sent' };
  }

  // ── Verify magic link ───────────────────────────────────────────────────────
  async verifyMagicLink(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const record = await this.magicLinkRepo.findOne({ where: { token: tokenHash } });

    // Always check in this order to avoid leaking info
    if (!record || record.used) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (new Date() > record.expiresAt) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Mark as used
    record.used = true;
    await this.magicLinkRepo.save(record);

    // Load user
    const user = await this.usersService.findById(record.userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateTokens(user);
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  async findOrCreateOAuthUser(data: {
    email: string; name: string; googleId: string;
  }) {
    let user = await this.usersService.findByEmail(data.email);
    if (!user) {
      user = await this.usersService.create({
        email:    data.email,
        name:     data.name,
        role:     UserRole.VIEWER,
        googleId: data.googleId,
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

    await this.storeRefreshToken(user.id, rawRefresh);

    return { accessToken, refreshToken: rawRefresh };
  }

  // ── Refresh (rotate token) ───────────────────────────────────────────────────
  async refreshTokens(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(rawToken, {
        secret:   this.config.get<string>('JWT_REFRESH_SECRET'),
        audience: 'refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.findStoredToken(payload.sub, rawToken);
    if (!stored || stored.isExpired) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.refreshRepo.delete(stored.id);

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateTokens(user);
  }

  // ── Logout (revoke refresh token) ────────────────────────────────────────────
  async logout(userId: string, rawToken: string): Promise<void> {
    const stored = await this.findStoredToken(userId, rawToken);
    if (stored) await this.refreshRepo.delete(stored.id);
  }

  // ── Private helpers ───────────────────────────────────────────────────────────
  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existing = await this.refreshRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
    if (existing.length >= 5) {
      await this.refreshRepo.delete(existing[0].id);
    }

    await this.refreshRepo.save(this.refreshRepo.create({ userId, tokenHash, expiresAt }));
  }

  private async findStoredToken(userId: string, rawToken: string): Promise<RefreshToken | null> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    return this.refreshRepo.findOne({ where: { userId, tokenHash } });
  }
}
