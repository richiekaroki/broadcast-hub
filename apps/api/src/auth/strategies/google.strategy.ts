import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private cfg: ConfigService) {
    super({ clientID: cfg.get<string>('GOOGLE_CLIENT_ID')!, clientSecret: cfg.get<string>('GOOGLE_CLIENT_SECRET')!, callbackURL: cfg.get<string>('GOOGLE_CALLBACK_URL')!, scope: ['email', 'profile'] });
  }
  async validate(_at: string, _rt: string, profile: any) {
    return { id: profile.id, name: profile.displayName, email: profile.emails?.[0]?.value };
  }
}
