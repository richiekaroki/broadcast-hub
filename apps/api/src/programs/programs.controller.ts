import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/programs')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRESENTER)
  @ApiOperation({ summary: 'Create a broadcast schedule slot' })
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  // FIX 9: page + limit query params for pagination
  @Get()
  @ApiOperation({ summary: 'Get broadcast schedule — Redis cached, paginated' })
  @ApiQuery({ name: 'page',  required: false, example: 1  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findSchedule(
    @Query('page')  page  = '1',
    @Query('limit') limit = '20',
  ) {
    return this.programsService.findSchedule(Number(page), Number(limit));
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRESENTER)
  @ApiOperation({ summary: 'Modify a scheduled program' })
  // FIX 9: UpdateProgramDto replaces the `data as any` cast
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto as any);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel a program (Super Admin only)' })
  cancel(@Param('id') id: string) {
    return this.programsService.cancel(id);
  }
}
