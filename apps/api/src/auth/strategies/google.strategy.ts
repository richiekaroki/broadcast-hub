import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(cfg: ConfigService) {
    const clientID = cfg.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = cfg.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      // Skip Google OAuth — strategy won't be registered
      super({ clientID: 'disabled', clientSecret: 'disabled', callbackURL: 'http://localhost' });
      this.logger.warn('Google OAuth disabled — GOOGLE_CLIENT_ID/SECRET not set');
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL: cfg.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
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
