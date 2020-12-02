/* eslint import/no-cycle: off */

import {Result, Ok, Err} from './result';

export interface Option<T> {
  isSome(): this is Some<T>;
  isNone(): this is None<T>;

  map<U>(fn: (val: T) => U): Option<U>;
  mapNullable<U>(fn: (val: T) => U | null | undefined): Option<U>;
  mapOr<U>(default_: U, fn: (val: T) => U): Option<U>;
  mapOrElse<U>(fallback: () => U, fn: (val: T) => U): U;
  filter(predicate: (val: T) => boolean): Option<T>;

  and<U>(opt: Option<U>): Option<U>;
  andThen<U>(fn: (val: T) => Option<U>): Option<U>;

  or(opt: Option<T>): Option<T>;
  orElse(fn: () => Option<T>): Option<T>;

  xor(opt: Option<T>): Option<T>;
  zip<U>(opt: Option<U>): Option<[T, U]>;

  okOr<E>(err: E): Result<T, E>;
  okOrElse<E>(fn: () => E): Result<T, E>;

  unwrap(): T | never;
  unwrapNullable(): T | null;
  unwrapOr(val: T): T;
  unwrapOrElse(fn: () => T): T;

  async(): AsyncOption<T>;
}

export interface AsyncOption<T> {
  map<U>(fn: (val: T) => Promise<U>): Promise<Option<U>>;
  mapNullable<U>(
    fn: (val: T) => Promise<U | null | undefined>,
  ): Promise<Option<U>>;
  filter(predicate: (val: T) => Promise<boolean>): Promise<Option<T>>;
  andThen<U>(fn: (val: T) => Promise<Option<U>>): Promise<Option<U>>;
  orElse(fn: () => Promise<Option<T>>): Promise<Option<T>>;
  okOrElse<E>(fn: () => Promise<E>): Promise<Result<T, E>>;
  unwrapOrElse(fn: () => Promise<T>): Promise<T>;
}

class BaseSome<T> {
  constructor(protected _value: T) {}
}

export class Some<T> extends BaseSome<T> implements Option<T> {
  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  map<U>(fn: (val: T) => U): Option<U> {
    return new Some(fn(this._value));
  }

  mapNullable<U>(fn: (val: T) => U | null | undefined): Option<U> {
    return optionify(fn(this._value));
  }

  mapOr<U>(_: U, fn: (val: T) => U): Option<U> {
    return new Some(fn(this._value));
  }

  mapOrElse<U>(_: () => U, fn: (val: T) => U): U {
    return fn(this._value);
  }

  filter(predicate: (val: T) => boolean): Option<T> {
    return predicate(this._value) ? new Some(this._value) : new None();
  }

  and<U>(opt: Option<U>): Option<U> {
    return opt;
  }

  andThen<U>(fn: (val: T) => Option<U>): Option<U> {
    return fn(this._value);
  }

  or(_: Option<T>): Option<T> {
    return new Some(this._value);
  }

  orElse(_: () => Option<T>): Option<T> {
    return new Some(this._value);
  }

  xor(opt: Option<T>): Option<T> {
    return opt.mapOrElse(
      () => new Some(this._value),
      () => new None<T>(),
    );
  }

  zip<U>(opt: Option<U>): Option<[T, U]> {
    return opt.andThen(u => new Some([this._value, u]));
  }

  okOr<E>(_: E): Result<T, E> {
    return new Ok(this._value);
  }

  okOrElse<E>(_: () => E): Result<T, E> {
    return new Ok(this._value);
  }

  unwrap(): T | never {
    return this._value;
  }

  unwrapNullable(): T | null {
    return this._value;
  }

  unwrapOr(_: T): T {
    return this._value;
  }

  unwrapOrElse(_: () => T): T {
    return this._value;
  }

  async(): AsyncOption<T> {
    return new AsyncSome(this._value);
  }
}

export class AsyncSome<T> extends BaseSome<T> implements AsyncOption<T> {
  async map<U>(fn: (val: T) => Promise<U>): Promise<Option<U>> {
    return new Some(await fn(this._value));
  }

  async mapNullable<U>(
    fn: (val: T) => Promise<U | null | undefined>,
  ): Promise<Option<U>> {
    return optionify(await fn(this._value));
  }

  async filter(predicate: (val: T) => Promise<boolean>): Promise<Option<T>> {
    return (await predicate(this._value)) ? new Some(this._value) : new None();
  }

  async andThen<U>(fn: (val: T) => Promise<Option<U>>): Promise<Option<U>> {
    return fn(this._value);
  }

  async unwrapOrElse(_: () => Promise<T>): Promise<T> {
    return this._value;
  }

  async orElse(_: () => Promise<Option<T>>): Promise<Option<T>> {
    return new Some(this._value);
  }

  async okOrElse<E>(_: () => Promise<E>): Promise<Result<T, E>> {
    return new Ok(this._value);
  }
}

export class None<T> implements Option<T> {
  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  map<U>(_: (val: T) => U): Option<U> {
    return new None();
  }

  mapNullable<U>(_: (val: T) => U | null | undefined): Option<U> {
    return new None();
  }

  mapOr<U>(default_: U, _: (val: T) => U): Option<U> {
    return new Some(default_);
  }

  mapOrElse<U>(fallback: () => U, _: (val: T) => U): U {
    return fallback();
  }

  filter(_: (val: T) => boolean): Option<T> {
    return new None();
  }

  and<U>(_: Option<U>): Option<U> {
    return new None();
  }

  andThen<U>(_: (val: T) => Option<U>): Option<U> {
    return new None();
  }

  or(opt: Option<T>): Option<T> {
    return opt;
  }

  orElse(fn: () => Option<T>): Option<T> {
    return fn();
  }

  xor(opt: Option<T>): Option<T> {
    return opt;
  }

  zip<U>(opt: Option<U>): Option<[T, U]> {
    return new None();
  }

  okOr<E>(err: E): Result<T, E> {
    return new Err(err);
  }

  okOrElse<E>(fn: () => E): Result<T, E> {
    return new Err(fn());
  }

  unwrap(): T | never {
    throw new Error('Unwrapped a None');
  }

  unwrapNullable(): T | null {
    return null;
  }

  unwrapOr(val: T): T {
    return val;
  }

  unwrapOrElse(fn: () => T): T {
    return fn();
  }

  async(): AsyncOption<T> {
    return new AsyncNone();
  }
}

export class AsyncNone<T> implements AsyncOption<T> {
  async map<U>(_: (val: T) => Promise<U>): Promise<Option<U>> {
    return new None();
  }

  async mapNullable<U>(
    _: (val: T) => Promise<U | null | undefined>,
  ): Promise<Option<U>> {
    return new None();
  }

  async filter(_: (val: T) => Promise<boolean>): Promise<Option<T>> {
    return new None();
  }

  async andThen<U>(_: (val: T) => Promise<Option<U>>): Promise<Option<U>> {
    return new None();
  }

  async orElse(fn: () => Promise<Option<T>>): Promise<Option<T>> {
    return fn();
  }

  async okOrElse<E>(fn: () => Promise<E>): Promise<Result<T, E>> {
    return new Err(await fn());
  }

  async unwrapOrElse(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

export function optionify<T>(val: T | null | undefined): Option<T> {
  if (val === undefined || val === null) {
    return new None();
  }

  return new Some(val);
}

type OptionArray<T> = {[P in keyof T]: Option<T[P]>};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function join<T1, T extends any[]>(
  opt1: Option<T1>,
  ...opts: OptionArray<T>
): Option<[T1, ...T[]]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return,
  return opts.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
    (acc, opt) => acc.andThen(arr => opt.map(val => [...arr, val])),
    opt1.map(val => [val]),
  );
}

export function zip2<T1, T2>(
  opt1: Option<T1>,
  opt2: Option<T2>,
): Option<[T1, T2]> {
  return opt1.andThen(val1 => opt2.map(val2 => [val1, val2]));
}
