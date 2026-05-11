import { User as PrismaUser } from '@prisma/client';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { User } from '../../domain/entities/user.entity';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const email = Email.create(raw.email);
    const password = Password.fromHash(raw.passwordHash);

    if (email.isFailure) throw new Error(`Invalid email in DB: ${raw.email}`);

    return User.reconstitute(
      {
        email: email.value,
        password,
        role: raw.role as any,
        status: raw.status as any,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(user: User): Omit<PrismaUser, 'id'> & { id: string } {
    return {
      id: user.id,
      email: user.email.value,
      passwordHash: user.password.value,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
