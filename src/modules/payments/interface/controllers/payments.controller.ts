// src/modules/payments/interface/controllers/payments.controller.ts
import {
  Controller, Post, Get, Body, UseGuards,
  Query, Param, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard }      from '@identity/interface/guards/jwt-auth.guard';
import { CurrentUser }       from '@identity/interface/decorators/current-user.decorator';
import { AuthenticatedUser } from '@identity/infrastructure/strategies/jwt.strategy';
import { InitiatePaymentHandler } from '../../application/commands/initiate-payment/initiate-payment.handler';
import { InitiatePaymentCommand } from '../../application/commands/initiate-payment/initiate-payment.command';
import { ListPaymentsQuery }  from '../../application/queries/list-payments.query';
import { GetPaymentQuery }    from '../../application/queries/get-payment.query';
import { InitiatePaymentDto } from '../dtos/initiate-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly initiateHandler: InitiatePaymentHandler,
    private readonly listQuery:       ListPaymentsQuery,
    private readonly getPaymentQuery: GetPaymentQuery,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a PIX / TED payment (idempotent)' })
  async initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    const result = await this.initiateHandler.execute(
      new InitiatePaymentCommand(
        user.userId,
        dto.receiverPixKey,
        dto.amountBRL,
        dto.type,
        dto.description,
        dto.idempotencyKey,
      ),
    );
    return { statusCode: 201, data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List authenticated user payment history' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.listQuery.byUserId(user.userId, Math.min(limit, 100));
    return { statusCode: 200, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single payment detail (must be a party to the payment)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const result = await this.getPaymentQuery.byId(id, user.userId);
    return { statusCode: 200, data: result };
  }
}
