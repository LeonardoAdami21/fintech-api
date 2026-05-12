// src/modules/identity/application/commands/register-user/register-user.handler.ts
import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RegisterUserCommand } from './register-user.command';
import * as userRepository_1 from '../../../domain/repositories/user.repository';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { User } from '../../../domain/entities/user.entity';

export interface RegisterUserResult {
  userId: string;
  email: string;
}

@Injectable()
export class RegisterUserHandler {
  constructor(
    @Inject(userRepository_1.USER_REPOSITORY)
    private readonly userRepository: userRepository_1.IUserRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // 1. Validate value objects
    const emailResult = Email.create(command.email);
    if (emailResult.isFailure) {
      throw new BadRequestException(emailResult.error.message);
    }

    const passwordResult = Password.create(command.password);
    if (passwordResult.isFailure) {
      throw new BadRequestException(passwordResult.error.message);
    }

    // 2. Check uniqueness
    const existing = await this.userRepository.findByEmail(
      emailResult.value.value,
    );
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // 3. Hash password and create aggregate
    const hashedPassword = await passwordResult.value.hash();

    const userResult = User.create({
      email: emailResult.value,
      password: hashedPassword,
    });

    if (userResult.isFailure) {
      throw new BadRequestException(userResult.error.message);
    }

    const user = userResult.value;

    // MVP: auto-activate on registration.
    // Production: replace with email verification flow (send token, POST /auth/activate).
    user.activate();

    await this.userRepository.save(user);
    user.clearDomainEvents();

    return { userId: user.id, email: user.email.value };
  }
}
