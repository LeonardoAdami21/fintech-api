// src/modules/identity/interface/dtos/register-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: 'Senha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string | undefined;
}

// src/modules/identity/interface/dtos/login-user.dto.ts
export class LoginUserDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string | undefined;

  @ApiProperty({ example: 'Senha123' })
  @IsString()
  password: string | undefined;
}
