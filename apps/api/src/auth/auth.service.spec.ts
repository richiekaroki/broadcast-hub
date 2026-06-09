import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockUser: User = {
  id:           'user-uuid-1',
  email:        'admin@demo.com',
  name:         'Admin User',
  passwordHash: bcrypt.hashSync('Demo1234!', 10),
  role:         UserRole.SUPER_ADMIN,
  googleId:     null,
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
        { provide: getRepositoryToken(RefreshToken),       useValue: mockRefreshRepo   },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Default: no existing refresh tokens
    mockRefreshRepo.find.mockResolvedValue([]);
    mockJwtService.signAsync.mockResolvedValue('signed-token');
  });

  // ── register ─────────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('creates a new user and returns token pair', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'new@demo.com', password: 'Demo1234!', name: 'New User',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@demo.com', name: 'New User' }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws ConflictException when email already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'admin@demo.com', password: 'Demo1234!', name: 'Admin' }),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('returns tokens for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login({ email: 'admin@demo.com', password: 'Demo1234!' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@demo.com', password: 'Demo1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'admin@demo.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── generateTokens ────────────────────────────────────────────────────────────
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

  // ── refreshTokens ─────────────────────────────────────────────────────────────
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

  // ── logout ────────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('silently succeeds when token not found (idempotent)', async () => {
      mockRefreshRepo.find.mockResolvedValue([]);

      await expect(service.logout(mockUser.id, 'any-token')).resolves.toBeUndefined();
    });
  });
});
