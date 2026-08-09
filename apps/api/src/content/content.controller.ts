import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AnalyticsService } from '../analytics/analytics.service';

// Minimal shape returned by JwtStrategy.validate()
interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create content (draft)' })
  // FIX 2: authorId comes from the JWT, not the request body
  create(@Body() dto: CreateContentDto, @CurrentUser() user: JwtUser) {
    return this.contentService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List published content' })
  findAll() {
    return this.contentService.findPublished();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID (records view, enforces visibility)' })
  // FIX 7: role passed so service can hide non-published content from viewers
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const content = await this.contentService.findOne(id, user.role);
    // Fire-and-forget analytics — errors logged inside recordView, never bubble up
    this.analyticsService.recordView(id, user.id);
    return content;
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update content (draft only)' })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  @Post(':id/submit')
  @Roles(UserRole.EDITOR)
  @ApiOperation({ summary: 'Submit content for review' })
  submit(@Param('id') id: string) {
    return this.contentService.submitForReview(id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Publish content' })
  publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject content with reason' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.contentService.reject(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete content' })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
