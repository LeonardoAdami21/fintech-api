// src/modules/payments/interface/controllers/payments.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { InitiatePaymentHandler } from '../../application/commands/initiate-payment/initiate-payment.handler';
import { InitiatePaymentCommand } from '../../application/commands/initiate-payment/initiate-payment.command';
import { ListPaymentsQuery } from '../../application/queries/list-payments.query';
import { GetPaymentQuery } from '../../application/queries/get-payment.query';
import { InitiatePaymentDto } from '../dtos/initiate-payment.dto';
import { JwtAuthGuard } from 'src/modules/identity/interface/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/identity/interface/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/modules/identity/infra/strategies/jwt.strategy';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly initiateHandler: InitiatePaymentHandler,
    private readonly listQuery: ListPaymentsQuery,
    private readonly getPaymentQuery: GetPaymentQuery,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Initiate a PIX / TED payment (idempotent)',
    description: 'Route to initiate a payment',
  })
  @ApiCreatedResponse({ description: 'Payment successfully initiated' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    const result = await this.initiateHandler.execute(
      new InitiatePaymentCommand(
        user.userId,
        dto.receiverPixKey,
        dto.amountBRL,
        dto.type as any,
        dto.description,
        dto.idempotencyKey,
      ),
    );
    return { statusCode: 201, data: result };
  }

  @Get()
  @ApiOperation({
    summary: 'List authenticated user payment history',
    description: 'Route to list payments',
  })
  @ApiOkResponse({ description: 'Payments successfully listed' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.listQuery.byUserId(
      user.userId,
      Math.min(limit, 100),
    );
    return { statusCode: 200, data: result };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single payment detail (must be a party to the payment)',
    description: 'Route to get a single payment',
  })
  @ApiOkResponse({ description: 'Payment successfully listed' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const result = await this.getPaymentQuery.byId(id, user.userId);
    return { statusCode: 200, data: result };
  }
}
