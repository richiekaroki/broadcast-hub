import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestMagicLinkDto {
  @ApiProperty({ example: 'admin@demo.com' })
  @IsEmail()
  email!: string;
}
