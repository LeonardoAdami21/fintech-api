// src/shared/domain/entity.base.ts
import { randomUUID } from 'crypto';

export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected readonly props: TProps;

  constructor(props: TProps, id?: string) {
    this._id = id ?? randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other?: Entity<TProps>): boolean {
    if (!other || !(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
