import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private cfg: ConfigService) {
    super({
      clientID:     cfg.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: cfg.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL:  cfg.get<string>('GOOGLE_CALLBACK_URL')!,
      scope:        ['email', 'profile'],
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
