import {
  Controller, Post, Body, Get, UseGuards,
  Req, Res, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ── Request magic link ─────────────────────────────────────────────────────
  @Post('magic-link')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 req/min per IP
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a magic link (passwordless login)' })
  requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  // ── Verify magic link ─────────────────────────────────────────────────────
  @Get('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify magic link token and receive JWT pair' })
  verifyMagicLink(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────
  @Get('oauth/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth() {
    // Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const oauthUser = req.user as { id: string; email: string; name: string };

    const user = await this.authService.findOrCreateOAuthUser({
      email:    oauthUser.email,
      name:     oauthUser.name,
      googleId: oauthUser.id,
    });

    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/auth/callback#accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (rotates refresh token)' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoke refresh token' })
  async logout(
    @CurrentUser() user: { id: string },
    @Body() dto: RefreshDto,
  ): Promise<void> {
    await this.authService.logout(user.id, dto.refreshToken);
  }
}
