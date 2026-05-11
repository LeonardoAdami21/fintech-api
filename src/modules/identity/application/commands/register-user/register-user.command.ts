// src/modules/identity/application/commands/register-user/register-user.command.ts
export class RegisterUserCommand {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}
