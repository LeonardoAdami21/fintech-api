import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from 'src/modules/identity/infra/services/token.service';
import { LoginUserCommand } from './login-user.command';
import { Session } from '../../../domain/entities/session.entity';
import * as userRepository from 'src/modules/identity/domain/repositories/user.repository';
import * as sessionRepository from 'src/modules/identity/domain/repositories/session.repository';

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: Date;
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class LoginUserHandler {
  private readonly logger = new Logger(LoginUserHandler.name);

  constructor(
    @Inject(userRepository.USER_REPOSITORY)
    private readonly userRepo: userRepository.IUserRepository,
    @Inject(sessionRepository.SESSION_REPOSITORY)
    private readonly sessionRepo: sessionRepository.ISessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const user = await this.userRepo.findByEmail(command.email.toLowerCase());
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const match = await user.password.compare(command.password);
    if (!match) throw new UnauthorizedException('As senhas não conferem');

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is ' + user.status.toLowerCase(),
      );
    }

    const pair = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });

    const sessionResult = Session.create({
      userId: user.id,
      refreshToken: pair.refreshTokenHash,
      ttlDays: this.tokenService.refreshTtlDays,
    });
    if (sessionResult.isFailure) throw new Error(sessionResult.error.message);
    await this.sessionRepo.save(sessionResult.value);

    this.logger.log(
      'User ' + user.id + ' logged in — session ' + sessionResult.value.id,
    );

    return {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      accessExpiresIn: pair.accessExpiresIn,
      refreshExpiresAt: pair.refreshExpiresAt,
      userId: user.id,
      email: user.email.value,
      role: user.role,
    };
  }
}
