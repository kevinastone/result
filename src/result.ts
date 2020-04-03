/* eslint @typescript-eslint/generic-type-naming: off */

import {Some, None, Option} from './option';

export interface Result<T, E> {
  isOk(): this is Ok<T, E>;
  isErr(): this is Err<T, E>;

  map<U>(fn: (val: T) => U): Result<U, E>;
  mapErr<F>(fn: (err: E) => F): Result<T, F>;
  mapOr<U>(fallback: U, fn: (val: T) => U): U;
  mapOrElse<U>(fallback: (err: E) => U, fn: (val: T) => U): U;

  and<U>(res: Result<U, E>): Result<U, E>;
  andThen<U>(fn: (val: T) => Result<U, E>): Result<U, E>;

  or<F>(res: Result<T, F>): Result<T, F>;
  orElse<F>(fn: (err: E) => Result<T, F>): Result<T, F>;

  ok(): Option<T>;

  unwrap(): T | never;
  unwrapErr(): E | never;
  unwrapOr(val: T): T;
  unwrapOrElse(fn: (err: E) => T): T;

  async(): AsyncResult<T, E>;
}

export interface AsyncResult<T, E> {
  map<U>(fn: (val: T) => Promise<U>): Promise<Result<U, E>>;
  mapErr<F>(fn: (err: E) => Promise<F>): Promise<Result<T, F>>;
  mapOr<U>(fallback: U, fn: (val: T) => Promise<U>): Promise<U>;
  mapOrElse<U>(
    fallback: (err: E) => Promise<U>,
    fn: (val: T) => Promise<U>,
  ): Promise<U>;
  andThen<U>(fn: (val: T) => Promise<Result<U, E>>): Promise<Result<U, E>>;
  orElse<F>(fn: (err: E) => Promise<Result<T, F>>): Promise<Result<T, F>>;
  unwrapOrElse(fn: (err: E) => Promise<T>): Promise<T>;
}

class BaseOk<T> {
  constructor(protected _value: T) {}
}

export class Ok<T, E> extends BaseOk<T> implements Result<T, E> {
  isOk(): boolean {
    return true;
  }

  isErr(): boolean {
    return false;
  }

  map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok(fn(this._value));
  }

  mapErr<F>(_: (err: E) => F): Result<T, F> {
    return new Ok(this._value);
  }

  mapOr<U>(_: U, fn: (val: T) => U): U {
    return fn(this._value);
  }

  mapOrElse<U>(_: (err: E) => U, fn: (val: T) => U): U {
    return fn(this._value);
  }

  and<U>(res: Result<U, E>): Result<U, E> {
    return res;
  }

  andThen<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    return fn(this._value);
  }

  or<F>(_: Result<T, F>): Result<T, F> {
    return new Ok(this._value);
  }

  orElse<F>(_: (err: E) => Result<T, F>): Result<T, F> {
    return new Ok(this._value);
  }

  ok(): Option<T> {
    return new Some(this._value);
  }

  unwrap(): T | never {
    return this._value;
  }

  unwrapErr(): E | never {
    throw new Error('unwrapErr on an Ok()');
  }

  unwrapOr(_: T): T {
    return this._value;
  }

  unwrapOrElse(_: (err: E) => T): T {
    return this._value;
  }

  async(): AsyncResult<T, E> {
    return new AsyncOk(this._value);
  }
}

export class AsyncOk<T, E> extends BaseOk<T> implements AsyncResult<T, E> {
  async map<U>(fn: (val: T) => Promise<U>): Promise<Result<U, E>> {
    return new Ok(await fn(this._value));
  }

  async mapErr<F>(_: (err: E) => Promise<F>): Promise<Result<T, F>> {
    return new Ok(this._value);
  }

  async mapOr<U>(_: U, fn: (val: T) => Promise<U>): Promise<U> {
    return fn(this._value);
  }

  async mapOrElse<U>(
    _: (err: E) => Promise<U>,
    fn: (val: T) => Promise<U>,
  ): Promise<U> {
    return fn(this._value);
  }

  async andThen<U>(
    fn: (val: T) => Promise<Result<U, E>>,
  ): Promise<Result<U, E>> {
    return fn(this._value);
  }

  async orElse<F>(_: (err: E) => Promise<Result<T, F>>): Promise<Result<T, F>> {
    return new Ok(this._value);
  }

  async unwrapOrElse(_: (err: E) => Promise<T>): Promise<T> {
    return this._value;
  }
}

class BaseErr<E> {
  constructor(protected _error: E) {}
}

export class Err<T, E> extends BaseErr<E> implements Result<T, E> {
  isOk(): boolean {
    return false;
  }

  isErr(): boolean {
    return true;
  }

  map<U>(_: (val: T) => U): Result<U, E> {
    return new Err(this._error);
  }

  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Err(fn(this._error));
  }

  mapOr<U>(fallback: U, _: (val: T) => U): U {
    return fallback;
  }

  mapOrElse<U>(fallback: (err: E) => U, _: (val: T) => U): U {
    return fallback(this._error);
  }

  and<U>(_: Result<U, E>): Result<U, E> {
    return new Err(this._error);
  }

  andThen<U>(_: (val: T) => Result<U, E>): Result<U, E> {
    return new Err(this._error);
  }

  or<F>(res: Result<T, F>): Result<T, F> {
    return res;
  }

  orElse<F>(fn: (err: E) => Result<T, F>): Result<T, F> {
    return fn(this._error);
  }

  ok(): Option<T> {
    return new None();
  }

  unwrap(): T | never {
    throw this._error;
  }

  unwrapErr(): E | never {
    return this._error;
  }

  unwrapOr(val: T): T {
    return val;
  }

  unwrapOrElse(fn: (err: E) => T): T {
    return fn(this._error);
  }

  async(): AsyncResult<T, E> {
    return new AsyncErr(this._error);
  }
}

export class AsyncErr<T, E> extends BaseErr<E> implements AsyncResult<T, E> {
  async map<U>(_: (val: T) => Promise<U>): Promise<Result<U, E>> {
    return new Err(this._error);
  }

  async mapErr<F>(fn: (err: E) => Promise<F>): Promise<Result<T, F>> {
    return new Err(await fn(this._error));
  }

  async mapOr<U>(fallback: U, _: (val: T) => Promise<U>): Promise<U> {
    return fallback;
  }

  async mapOrElse<U>(
    fallback: (err: E) => Promise<U>,
    _: (val: T) => Promise<U>,
  ): Promise<U> {
    return fallback(this._error);
  }

  async andThen<U>(
    _: (val: T) => Promise<Result<U, E>>,
  ): Promise<Result<U, E>> {
    return new Err(this._error);
  }

  async orElse<F>(
    fn: (err: E) => Promise<Result<T, F>>,
  ): Promise<Result<T, F>> {
    return fn(this._error);
  }

  async unwrapOrElse(fn: (err: E) => Promise<T>): Promise<T> {
    return fn(this._error);
  }
}

export async function resultify<T, E>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  return promise.then(
    val => new Ok(val),
    err => new Err(err),
  );
}

export function asResult<T, E, A extends any[]>(
  fn: (...args: A) => T,
  ...args: A
): Result<T, E> {
  try {
    return new Ok(fn(...args));
  } catch (error) {
    return new Err(error);
  }
}
