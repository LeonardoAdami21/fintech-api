// src/modules/identity/interface/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

export const Roles =
  (...roles: string[]) =>
  (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
  };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(ROLES_KEY, ctx.getHandler());
    if (!required || required.length === 0) return true;
    const { user } = ctx.switchToHttp().getRequest();
    if (!required.includes(user?.role)) {
      throw new ForbiddenException('Permissão insuficiente');
    }
    return true;
  }
}
