import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host:   this.config.get<string>('SMTP_HOST'),
      port:   this.config.get<number>('SMTP_PORT'),
      secure: false, // STARTTLS on port 587
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });

    this.logger.log(`Email service initialized (SMTP: ${this.config.get<string>('SMTP_HOST')})`);
  }

  async sendMagicLink(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/auth/verify?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from:    '"Wam Broadcast Hub" <no-reply@broadcasthub.app>',
      to,
      subject: 'Your Magic Link — Wam Broadcast Hub',
      html:    `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; }
            .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px 32px; text-align: center; }
            h1 { font-size: 20px; color: #1a1a1a; margin: 0 0 8px; }
            p { font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 24px; }
            .btn { display: inline-block; padding: 14px 32px; background: #E8593C; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
            .note { font-size: 12px; color: #999; margin-top: 24px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Wam Broadcast Hub</h1>
            <p>Click the button below to sign in to your account. This link expires in 10 minutes.</p>
            <a href="${verifyUrl}" class="btn">Sign In</a>
            <p class="note">If you didn't request this link, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `Sign in to Wam Broadcast Hub: ${verifyUrl}\n\nThis link expires in 10 minutes.`,
    });

    this.logger.log(`Magic link email sent to ${to}`);
  }
}
