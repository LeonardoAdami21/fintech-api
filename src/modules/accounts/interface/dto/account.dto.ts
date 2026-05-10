// src/modules/accounts/interface/dtos/account.dto.ts
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PixKeyType } from '@prisma/client';

export class RegisterPixKeyDto {
  @ApiProperty({
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    description: 'Type of PIX key',
  })
  @IsEnum(Object.values(PixKeyType))
  @IsNotEmpty()
  pixKeyType?: string;

  @ApiProperty({ example: '11122233344', description: 'Value of PIX key' })
  @IsString()
  @IsNotEmpty()
  keyValue?: string;
}
