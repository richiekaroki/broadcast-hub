import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(cfg: ConfigService) {
    super({
      clientID:     cfg.get<string>('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: cfg.get<string>('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL:  cfg.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/google/callback',
      scope:        ['email', 'profile'],
    });

    if (!cfg.get<string>('GOOGLE_CLIENT_ID')) {
      this.logger.warn('Google OAuth disabled — GOOGLE_CLIENT_ID/SECRET not set');
    }
  }

  async validate(_at: string, _rt: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const verified = profile.emails?.[0]?.verified;

    if (!email) {
      throw new UnauthorizedException('No email found in Google profile');
    }

    if (!verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      id:    profile.id,
      name:  profile.displayName,
      email,
    };
  }
}
