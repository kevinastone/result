/* istanbul ignore file */
/* eslint @typescript-eslint/generic-type-naming: off, @typescript-eslint/explicit-function-return-type: off */
/* eslint import/no-extraneous-dependencies: off */
/* eslint no-redeclare: off */

import {printExpected, printReceived} from 'jest-matcher-utils';
import {Option, Result} from '../src';

interface Unwrappable<T> {
  unwrap(): T | never;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeErr: () => R;
      toBeNone: () => R;
      toBeOk: () => R;
      toBeSome: () => R;
      toUnwrapEqual: <T>(argument: T) => R;
      toUnwrapErrEqual: <T, E>(argument: E) => R;
    }
  }
}

function toBeNone<T>(received: Option<T>) {
  return {
    pass: received.isNone(),
    message: () =>
      `Expected value to be None, received: ${printReceived(received)}`,
  };
}

function toBeSome<T>(received: Option<T>) {
  return {
    pass: received.isSome(),
    message: () =>
      `Expected value to be Some, received: ${printReceived(received)}`,
  };
}

function toUnwrapEqual<T>(
  this: jest.MatcherUtils,
  received: Unwrappable<T>,
  argument: T,
) {
  return {
    pass: this.equals(received.unwrap(), argument),
    message: () =>
      `Expected value to be equal to ${printExpected(
        argument,
      )}, received: ${printReceived(received)}`,
  };
}

function toUnwrapErrEqual<T, E>(
  this: jest.MatcherUtils,
  received: Result<T, E>,
  argument: E,
) {
  return {
    pass: this.equals(received.unwrapErr(), argument),
    message: () =>
      `Expected value to be equal to ${printExpected(
        argument,
      )}, received: ${printReceived(received)}`,
  };
}

function toBeOk<T, E>(received: Result<T, E>) {
  return {
    pass: received.isOk(),
    message: () =>
      `Expected value to be Ok, received: ${printReceived(received)}`,
  };
}

function toBeErr<T, E>(received: Result<T, E>) {
  return {
    pass: received.isErr(),
    message: () =>
      `Expected value to be Err, received: ${printReceived(received)}`,
  };
}

expect.extend({
  toBeErr,
  toBeNone,
  toBeOk,
  toBeSome,
  toUnwrapEqual,
  toUnwrapErrEqual,
});

export default expect;
