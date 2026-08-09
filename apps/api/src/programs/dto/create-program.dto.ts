import { IsString, IsDateString, MinLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateProgramDto {
  @ApiProperty({ example: 'Evening News at 7' }) @IsString() @MinLength(3) title!: string;
  @ApiProperty({ example: '2026-06-15T19:00:00.000Z' }) @IsDateString() startTime!: string;
  @ApiProperty({ example: '2026-06-15T20:00:00.000Z' }) @IsDateString() endTime!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() presenterId?: string;
}
