// src/modules/identity/application/commands/login-user/login-user.command.ts
export class LoginUserCommand {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}
