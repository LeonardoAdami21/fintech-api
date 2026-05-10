// src/shared/domain/result.ts

import { ConflictException } from '@nestjs/common';

export class Result<T, E = Error> {
  private readonly _value?: T;
  private readonly _error?: E;
  private readonly _isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess)
      throw new ConflictException('Cannot get value from a failed Result');
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess)
      throw new ConflictException('Cannot get error from a successful Result');
    return this._error as E;
  }

  static ok<T>(value: T): Result<T, never> {
    return new Result<T, never>(true, value);
  }

  static fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined, error);
  }
}

export type DomainError = {
  code: string;
  message: string;
};
