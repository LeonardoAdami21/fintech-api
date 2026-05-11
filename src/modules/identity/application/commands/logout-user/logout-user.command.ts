// src/modules/identity/application/commands/logout-user/logout-user.command.ts
export class LogoutUserCommand {
  constructor(
    readonly userId:    string,
    readonly sessionId?: string,  // omit to revoke ALL sessions (global logout)
  ) {}
}
