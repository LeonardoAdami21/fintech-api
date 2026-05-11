// src/modules/payments/interface/dtos/initiate-payment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Receiver PIX key' })
  @IsString()
  receiverPixKey!: string;

  @ApiProperty({ example: 50.0, description: 'Amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amountBRL!: number;

  @ApiProperty({
    enum: ['PIX', 'TED', 'INTERNAL'],
    example: 'PIX',
    description: 'Payment type',
  })
  @IsEnum(['PIX', 'TED', 'INTERNAL'])
  type!: string;

  @ApiPropertyOptional({
    example: 'Aluguel março',
    description: 'Payment description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Client-generated idempotency key (UUID recommended)',
    example: '123e4567-e89b-12d3-a456-426655440000',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
