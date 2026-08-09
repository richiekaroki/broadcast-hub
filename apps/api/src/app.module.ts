import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { User } from './users/entities/user.entity';
import { Content } from './content/entities/content.entity';
import { Program } from './programs/entities/program.entity';
import { RefreshToken } from './auth/refresh-token.entity';
import { MagicLinkToken } from './auth/magic-link-token.entity';
import { AnalyticsEvent } from './analytics/analytics-event.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ProgramsModule } from './programs/programs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'postgres',
        url:         cfg.get('DATABASE_URL'),
        entities:    [User, Content, Program, RefreshToken, MagicLinkToken, AnalyticsEvent],
        synchronize: cfg.get('NODE_ENV') !== 'production',
      }),
    }),

    // Rate limiting — 100 req/min per IP, now actually enforced via APP_GUARD
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    UsersModule,
    AuthModule,
    ContentModule,
    ProgramsModule,
    AnalyticsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
