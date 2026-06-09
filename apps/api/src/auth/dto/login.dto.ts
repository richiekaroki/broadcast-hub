import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ example: 'admin@demo.com' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Demo1234!' }) @IsString() password: string;
}
