import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
  @ApiProperty({ example: 'Richard Karoki' }) @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: 'richard@demo.com' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Demo1234!' }) @IsString() @MinLength(6) password: string;
}
