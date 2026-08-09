import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { RefreshToken } from './refresh-token.entity';
import { MagicLinkToken } from './magic-link-token.entity';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, MagicLinkToken]),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, GoogleStrategy],
  exports:     [AuthService],
})
export class AuthModule {}
