import { Controller, Get, Patch, Param, Body, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from './enums/user-role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: { id: string }) {
    const found = await this.usersService.findOne(user.id);
    return {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      createdAt: found.createdAt,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      createdAt: updated.createdAt,
    };
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  async listUsers() {
    const users = await this.usersService.findAll();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change user role (admin only)' })
  async changeRole(
    @CurrentUser() admin: { id: string; email: string },
    @Param('id') targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (admin.id === targetUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const target = await this.usersService.findOne(targetUserId);
    const oldRole = target.role;

    if (oldRole === dto.role) {
      throw new BadRequestException(`User already has role "${dto.role}"`);
    }

    const updated = await this.usersService.updateRole(targetUserId, dto.role);

    await this.auditService.log({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'role_changed',
      targetType: 'user',
      targetId: targetUserId,
      meta: { oldRole, newRole: dto.role, targetEmail: target.email },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    };
  }

  @Get('audit-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'View audit logs (admin only)' })
  async getAuditLogs() {
    return this.auditService.findAll(100);
  }
}
