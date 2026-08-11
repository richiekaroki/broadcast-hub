import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.EDITOR })
  @IsEnum(UserRole, { message: 'Invalid role. Must be: super_admin, editor, presenter, advertiser, viewer' })
  @IsNotEmpty()
  role!: UserRole;
}
