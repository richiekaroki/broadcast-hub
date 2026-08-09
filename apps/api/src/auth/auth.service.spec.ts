import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { MagicLinkToken } from './magic-link-token.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { EmailService } from '../email/email.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockUser: User = {
  id:           'user-uuid-1',
  email:        'admin@demo.com',
  name:         'Admin User',
  role:         UserRole.SUPER_ADMIN,
  googleId:     undefined,
  createdAt:    new Date(),
  updatedAt:    new Date(),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockUsersService = {
  findByEmail: jest.fn(),
  findById:    jest.fn(),
  create:      jest.fn(),
};

const mockJwtService = {
  signAsync:   jest.fn().mockResolvedValue('signed-token'),
  verifyAsync: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET:         'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      FRONTEND_URL:       'http://localhost:3000',
    };
    return map[key];
  }),
};

const mockRefreshRepo = {
  find:   jest.fn().mockResolvedValue([]),
  save:   jest.fn(),
  create: jest.fn(dto => dto),
  delete: jest.fn(),
};

const mockMagicLinkRepo = {
  find:   jest.fn().mockResolvedValue([]),
  save:   jest.fn(),
  create: jest.fn(dto => dto),
  delete: jest.fn(),
  update: jest.fn(),
};

const mockEmailService = {
  sendMagicLink: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService,                           useValue: mockUsersService  },
        { provide: JwtService,                             useValue: mockJwtService    },
        { provide: ConfigService,                          useValue: mockConfig        },
        { provide: EmailService,                           useValue: mockEmailService  },
        { provide: getRepositoryToken(RefreshToken),       useValue: mockRefreshRepo   },
        { provide: getRepositoryToken(MagicLinkToken),     useValue: mockMagicLinkRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Default: no existing tokens
    mockRefreshRepo.find.mockResolvedValue([]);
    mockMagicLinkRepo.find.mockResolvedValue([]);
    mockJwtService.signAsync.mockResolvedValue('signed-token');
  });

  // ── requestMagicLink ────────────────────────────────────────────────────────
  describe('requestMagicLink()', () => {
    it('returns success message when email is registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.requestMagicLink('admin@demo.com');

      expect(result).toHaveProperty('message');
      expect(mockMagicLinkRepo.save).toHaveBeenCalled();
      expect(mockMagicLinkRepo.create).toHaveBeenCalled();
    });

    it('returns same success message even when email not found (no enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestMagicLink('unknown@example.com');

      expect(result).toHaveProperty('message');
      expect(mockMagicLinkRepo.save).not.toHaveBeenCalled();
    });

    it('deletes old tokens for the same email before creating new one', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await service.requestMagicLink('admin@demo.com');

      expect(mockMagicLinkRepo.delete).toHaveBeenCalled();
    });
  });

  // ── verifyMagicLink ─────────────────────────────────────────────────────────
  describe('verifyMagicLink()', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockMagicLinkRepo.find.mockResolvedValue([]);

      await expect(service.verifyMagicLink('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      mockMagicLinkRepo.find.mockResolvedValue([{
        id: 'token-1',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        used: false,
        createdAt: new Date(),
      }]);

      await expect(service.verifyMagicLink('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for used token', async () => {
      mockMagicLinkRepo.find.mockResolvedValue([{
        id: 'token-1',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes from now
        used: true,
        createdAt: new Date(),
      }]);

      await expect(service.verifyMagicLink('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens for valid token', async () => {
      mockMagicLinkRepo.find.mockResolvedValue([{
        id: 'token-1',
        token: 'hashed-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        used: false,
        createdAt: new Date(),
      }]);
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.verifyMagicLink('valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockMagicLinkRepo.save).toHaveBeenCalled(); // marks token as used
    });
  });

  // ── generateTokens ──────────────────────────────────────────────────────────
  describe('generateTokens()', () => {
    it('signs access token with JWT_SECRET', async () => {
      await service.generateTokens(mockUser);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id, role: mockUser.role }),
        expect.objectContaining({ secret: 'test-access-secret', expiresIn: '15m' }),
      );
    });

    it('signs refresh token with JWT_REFRESH_SECRET and audience:refresh', async () => {
      await service.generateTokens(mockUser);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id }),
        expect.objectContaining({
          secret:   'test-refresh-secret',
          audience: 'refresh',
          expiresIn: '7d',
        }),
      );
    });

    it('stores hashed refresh token in the database', async () => {
      await service.generateTokens(mockUser);

      expect(mockRefreshRepo.save).toHaveBeenCalled();
      const savedArg = mockRefreshRepo.create.mock.calls[0][0];
      expect(savedArg).toHaveProperty('userId', mockUser.id);
      expect(savedArg).toHaveProperty('tokenHash');
      expect(savedArg.tokenHash).not.toBe('signed-token'); // must be hashed
    });
  });

  // ── refreshTokens ───────────────────────────────────────────────────────────
  describe('refreshTokens()', () => {
    it('throws UnauthorizedException for invalid JWT signature', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token not found in DB', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      mockRefreshRepo.find.mockResolvedValue([]); // no stored tokens

      await expect(service.refreshTokens('valid-jwt-but-not-stored')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('silently succeeds when token not found (idempotent)', async () => {
      mockRefreshRepo.find.mockResolvedValue([]);

      await expect(service.logout(mockUser.id, 'any-token')).resolves.toBeUndefined();
    });
  });
});
