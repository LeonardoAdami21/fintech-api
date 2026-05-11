// src/modules/accounts/interface/controllers/accounts.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from 'src/modules/identity/infra/strategies/jwt.strategy';
import { CurrentUser } from 'src/modules/identity/interface/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/identity/interface/guards/jwt-auth.guard';
import {
  OpenAccountCommand,
  OpenAccountHandler,
} from '../../application/commands/open-account/open-account.handler';
import {
  RegisterPixKeyCommand,
  RegisterPixKeyHandler,
} from '../../application/commands/register-pix-key/register-pix-key.handler';
import { GetAccountQuery } from '../../application/queries/get-account.query';
import { RegisterPixKeyDto } from '../dto/account.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly openAccountHandler: OpenAccountHandler,
    private readonly registerPixKeyHandler: RegisterPixKeyHandler,
    private readonly getAccountQuery: GetAccountQuery,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Open a new account for the authenticated user',
    description: 'Route to open a new account',
  })
  @ApiCreatedResponse({ description: 'Account created successfully' })
  @ApiBadRequestResponse({ description: 'User already has an account' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async open(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.openAccountHandler.execute(
      new OpenAccountCommand(user.userId),
    );
    return { statusCode: 201, data: result };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user account details and balance',
    description: 'Route to get current user account details and balance',
  })
  @ApiOkResponse({ description: 'Account details retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getMyAccount(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.getAccountQuery.byUserId(user.userId);
    return { statusCode: 200, data: result };
  }

  @Post('me/pix-keys')
  @ApiOperation({
    summary: 'Register a new PIX key on the current account',
    description: 'Route to register a new PIX key on the current account',
  })
  @ApiCreatedResponse({ description: 'PIX key registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid PIX key type or value' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async registerPixKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPixKeyDto,
  ) {
    const result = await this.registerPixKeyHandler.execute(
      new RegisterPixKeyCommand(
        user.userId,
        dto.pixKeyType as any,
        dto.keyValue as any,
      ),
    );
    return { statusCode: 201, data: result };
  }
}
