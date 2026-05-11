import { DomainError, Result } from "src/shared/domain/result";
import { ValueObject } from "src/shared/domain/value-object.base";


interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Result<Email, DomainError> {
    const trimmed = email.trim().toLowerCase();
    if (!Email.REGEX.test(trimmed)) {
      return Result.fail({ code: 'INVALID_EMAIL', message: `"${email}" não parece ser um email válido` });
    }
    return Result.ok(new Email({ value: trimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
