import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('Dashboard') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}
  @Get() @ApiOperation({ summary: 'Get aggregated dashboard statistics' }) getStats() { return this.svc.getStats(); }
}
