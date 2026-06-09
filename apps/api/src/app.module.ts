import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { User } from './users/entities/user.entity';
import { Content } from './content/entities/content.entity';
import { Program } from './programs/entities/program.entity';
import { RefreshToken } from './auth/refresh-token.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContentModule } from './content/content.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ProgramsModule } from './programs/programs.module';

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
        entities:    [User, Content, Program, RefreshToken], // RefreshToken added
        synchronize: cfg.get('NODE_ENV') !== 'production',
      }),
    }),

    MongooseModule.forRootAsync({
      inject:     [ConfigService],
      useFactory: (cfg: ConfigService) => ({ uri: cfg.get('MONGODB_URL') }),
    }),

    RedisModule.forRootAsync({
      inject:     [ConfigService],
      useFactory: (cfg: ConfigService) => ({ type: 'single', url: cfg.get('REDIS_URL') }),
    }),

    // Rate limiting — 100 req/min per IP, now actually enforced via APP_GUARD
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    UsersModule,
    AuthModule,
    ContentModule,
    ProgramsModule,
    AnalyticsModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
