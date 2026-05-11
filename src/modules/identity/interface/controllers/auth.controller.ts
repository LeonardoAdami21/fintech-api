// src/modules/identity/interface/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterUserHandler } from '../../application/commands/register-user/register-user.handler';
import { LoginUserHandler } from '../../application/commands/login-user/login-user.handler';
import { RefreshTokenHandler } from '../../application/commands/refresh-token/refresh-token.handler';
import { LogoutUserHandler } from '../../application/commands/logout-user/logout-user.handler';
import { RegisterUserCommand } from '../../application/commands/register-user/register-user.command';
import { LoginUserCommand } from '../../application/commands/login-user/login-user.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token/refresh-token.command';
import { LogoutUserCommand } from '../../application/commands/logout-user/logout-user.command';
import { ListSessionsQuery } from '../../application/queries/list-sessions.query';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginUserDto, RegisterUserDto } from '../dto/auth.dto';
import type { AuthenticatedUser } from '../../infra/strategies/jwt.strategy';

class RefreshTokenDto {
  @ApiProperty({
    description:
      'Opaque refresh token received at login (format: sessionId.randomPart)',
  })
  @IsString()
  refreshToken?: string;
}

class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Session ID to revoke. Omit to revoke all sessions (all devices).',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerHandler: RegisterUserHandler,
    private readonly loginHandler: LoginUserHandler,
    private readonly refreshHandler: RefreshTokenHandler,
    private readonly logoutHandler: LogoutUserHandler,
    private readonly listSessionsQuery: ListSessionsQuery,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Route to register a new user',
  })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
  })
  @ApiBadRequestResponse({ description: 'User already exists.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async register(@Body() dto: RegisterUserDto) {
    return {
      statusCode: 201,
      data: await this.registerHandler.execute(
        new RegisterUserCommand(dto.email as string, dto.password as string),
      ),
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login — returns access + refresh token pair',
    description: 'Route to login a user',
  })
  @ApiOkResponse({ description: 'User has been successfully logged in.' })
  @ApiBadRequestResponse({ description: 'Invalid credentials.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async login(@Body() dto: LoginUserDto) {
    return {
      statusCode: 200,
      data: await this.loginHandler.execute(
        new LoginUserCommand(dto.email as string, dto.password as string),
      ),
    };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token',
    description:
      'Old token is immediately revoked and a new pair is issued. ' +
      'Reuse of a revoked token triggers global session revocation (theft detection).',
  })
  @ApiOkResponse({
    description: 'New token pair has been successfully issued.',
  })
  @ApiBadRequestResponse({ description: 'Invalid refresh token.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return {
      statusCode: 200,
      data: await this.refreshHandler.execute(
        new RefreshTokenCommand(dto.refreshToken as string),
      ),
    };
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Logout — revoke one session or all devices (omit sessionId for global)',
    description:
      'Revoke one session or all devices (omit sessionId for global logout).',
  })
  @ApiOkResponse({ description: 'Session has been successfully revoked.' })
  @ApiBadRequestResponse({ description: 'Invalid session ID.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async logout(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogoutDto) {
    return {
      statusCode: 200,
      data: await this.logoutHandler.execute(
        new LogoutUserCommand(user.userId, dto.sessionId),
      ),
    };
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List all active sessions for the current user (connected devices)',
    description:
      'List all active sessions for the current user (connected devices).',
  })
  @ApiOkResponse({ description: 'List of active sessions.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async sessions(@CurrentUser() user: AuthenticatedUser) {
    return {
      statusCode: 200,
      data: await this.listSessionsQuery.byUserId(user.userId),
    };
  }

  // ── Me ────────────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current authenticated user info',
    description: 'Route to get current authenticated user info',
  })
  @ApiOkResponse({ description: 'Current user info' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return { statusCode: 200, data: user };
  }
}
