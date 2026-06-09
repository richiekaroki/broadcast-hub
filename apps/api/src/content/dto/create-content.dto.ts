import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateContentDto {
  @ApiProperty({ example: 'Evening News Bulletin' }) @IsString() @IsNotEmpty() title: string;
  @ApiProperty({ example: 'Top stories from Kenya...' }) @IsString() @IsNotEmpty() body: string;
}
