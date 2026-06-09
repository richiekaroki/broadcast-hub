import { PartialType } from '@nestjs/swagger';
import { CreateProgramDto } from './create-program.dto';

// FIX 9: proper UpdateProgramDto replaces `Partial<CreateProgramDto>` cast to any
// All fields optional, same validation rules as create
export class UpdateProgramDto extends PartialType(CreateProgramDto) {}
