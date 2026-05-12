// src/modules/accounts/application/commands/remove-pix-key/remove-pix-key.command.ts
export class RemovePixKeyCommand {
  constructor(
    readonly userId: string,
    readonly keyValue: string,
  ) {}
}
