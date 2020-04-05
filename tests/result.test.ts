import {resultify, asResult, Result, Ok, Err} from '../src/result';
import expect from './matchers';

function* range(end: number, start = 0): IterableIterator<number> {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

describe('resultify', () => {
  test('resolved => Ok', async () => {
    const result = await resultify(Promise.resolve('test'));
    expect(result).toBeOk();
    expect(result).toUnwrapEqual('test');
  });

  test('rejected => Err', async () => {
    const error = new Error('test');
    const result = await resultify(Promise.reject(error));
    expect(result).toBeErr();
    expect(result).toUnwrapErrEqual(error);
  });
});

describe('asResult', () => {
  test('Return => Ok', async () => {
    const fn = jest.fn(() => 42);
    const result = asResult(fn);
    expect(result).toBeOk();
    expect(result).toUnwrapEqual(42);
  });

  test('Throw => Err', async () => {
    const error = new Error('test');
    const fn = jest.fn(() => {
      throw error;
    });
    const result = asResult(fn);
    expect(result).toBeErr();
    expect(result).toUnwrapErrEqual(error);
  });
});

describe('isOk', () => {
  test('Ok.isOk() => true', () => {
    expect(new Ok(undefined).isOk()).toBe(true);
  });

  test('Err.isOk() => false', () => {
    expect(new Err(undefined).isOk()).toBe(false);
  });
});

describe('isErr', () => {
  test('Ok.isErr() => false', () => {
    expect(new Ok(undefined).isErr()).toBe(false);
  });

  test('Err.isErr() => true', () => {
    expect(new Err(undefined).isErr()).toBe(true);
  });
});

describe('map', () => {
  test('Ok is mapped', () => {
    expect(new Ok(2).map(n => n * 2)).toUnwrapEqual(4);
  });

  test('Types are mapped', () => {
    expect(new Ok(2).map(n => 'test'.repeat(n))).toUnwrapEqual('testtest');
  });

  test("Err doesn't call map", () => {
    const fn = jest.fn(x => x * x);
    new Err(2).map(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('mapErr', () => {
  test('Err is mapped', () => {
    expect(new Err(2).mapErr(n => n * 2)).toUnwrapErrEqual(4);
  });

  test('Types are mapped', () => {
    expect(new Err(2).mapErr(n => 'test'.repeat(n))).toUnwrapErrEqual(
      'testtest',
    );
  });

  test("Ok doesn't call mapErr", () => {
    const fn = jest.fn(x => x * x);
    new Ok(2).mapErr(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('mapOr', () => {
  test('Ok is mapped', () => {
    expect(new Ok<number, number>(2).mapOr(3, n => n * 2)).toEqual(4);
  });

  test('Err is mapped', () => {
    expect(new Err<number, number>(2).mapOr(3, n => n * 2)).toEqual(3);
  });

  test('Types are mapped', () => {
    expect(
      new Err<number, number>(2).mapOr('error', n => 'test'.repeat(n)),
    ).toEqual('error');
  });
});

describe('mapOrElse', () => {
  test('Ok is mapped', () => {
    expect(
      new Ok<number, number>(2).mapOrElse(
        e => e + 1,
        n => n * 2,
      ),
    ).toEqual(4);
  });

  test('Err is mapped', () => {
    expect(
      new Err<number, number>(2).mapOrElse(
        e => e + 1,
        n => n * 2,
      ),
    ).toEqual(3);
  });

  test('Types are mapped', () => {
    expect(
      new Err<number, number>(2).mapOrElse(
        e => 'e'.repeat(e),
        n => 'test'.repeat(n),
      ),
    ).toEqual('ee');
  });
});

describe('and', () => {
  test('Ok chained to an Ok', () => {
    expect(new Ok(2).and(new Ok(undefined))).toBeOk();
  });

  test('Ok chained to an Err', () => {
    expect(new Ok(2).and(new Err(undefined))).toBeErr();
  });

  test('Err chained to an Ok', () => {
    expect(new Err(2).and(new Ok(undefined))).toBeErr();
  });

  test('Ok is chained', () => {
    expect(new Ok(2).and(new Ok('good'))).toUnwrapEqual('good');
  });
});

describe('andThen', () => {
  test('Ok chained to an Ok', () => {
    expect(new Ok(2).andThen(_ => new Ok(undefined))).toBeOk();
  });

  test('Ok chained to an Err', () => {
    expect(new Ok(2).andThen(_ => new Err(undefined))).toBeErr();
  });

  test('Ok is chained', () => {
    expect(new Ok(2).andThen(n => new Ok('good'.repeat(n)))).toUnwrapEqual(
      'goodgood',
    );
  });

  test("Err doesn't chain", () => {
    const fn = jest.fn((x: number): Result<number, number> => new Ok(x * x));
    new Err<number, number>(2).andThen(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('or', () => {
  test('Ok chained to an Ok', () => {
    expect(new Ok(2).or(new Err(undefined))).toBeOk();
  });

  test('Ok chained to an Err', () => {
    expect(new Ok(2).or(new Err(undefined))).toBeOk();
  });

  test('Err chained to an Ok', () => {
    expect(new Err(2).or(new Ok(undefined))).toBeOk();
  });

  test("Ok doesn't chain", () => {
    expect(new Ok(2).or(new Err('good'))).toUnwrapEqual(2);
  });
});

describe('orElse', () => {
  test('Ok chained to an Ok', () => {
    expect(new Err(2).orElse(_ => new Ok(undefined))).toBeOk();
  });

  test('Err chained to an Err', () => {
    const result = new Err(2).orElse(_ => new Err(0));
    expect(result).toBeErr();
    expect(result).toUnwrapErrEqual(0);
  });

  test("Ok doesn't chain", () => {
    const fn = jest.fn((x: number): Result<number, number> => new Ok(x * x));
    expect(new Ok<number, number>(2).orElse(fn)).toUnwrapEqual(2);
    expect(fn).not.toHaveBeenCalled();
  });

  test('Err is chained', () => {
    const fn = jest.fn((x: number): Result<number, number> => new Ok(x * x));
    new Err<number, number>(2).orElse(fn);
    expect(fn).toHaveBeenCalled();
  });
});

describe('ok', () => {
  test('Ok => Option', () => {
    expect(new Ok(undefined).ok()).toBeSome();
  });

  test('Err => Option', () => {
    expect(new Err(undefined).ok()).toBeNone();
  });
});

describe('unwrap', () => {
  test('Ok => T', () => {
    expect(new Ok(2).unwrap()).toBe(2);
  });

  test('Err => Exception', () => {
    expect(() => new Err(undefined).unwrap()).toThrow();
  });
});

describe('unwrapErr', () => {
  test('Ok => Exception', () => {
    expect(() => new Ok(2).unwrapErr()).toThrow();
  });

  test('Err => E', () => {
    expect(new Err('bad').unwrapErr()).toBe('bad');
  });
});

describe('unwrapOr', () => {
  test('Ok => Value', () => {
    expect(new Ok(2).unwrapOr(3)).toBe(2);
  });

  test('Err => Or', () => {
    expect(new Err<number, unknown>(undefined).unwrapOr(3)).toBe(3);
  });
});

describe('unwrapOrElse', () => {
  test('Ok => Value', () => {
    expect(new Ok(2).unwrapOrElse(_ => 3)).toBe(2);
  });

  test('Err => Or', () => {
    expect(new Err('bad').unwrapOrElse(_ => 3)).toBe(3);
  });
});

describe('AsyncResult', () => {
  describe('map', () => {
    test('mapped async functions', async () => {
      const input = new Ok(2);
      const result = await input.async().map(async n => Promise.resolve(n * n));
      expect(result).toUnwrapEqual(4);
    });

    test('chain mapped async functions', async () => {
      const input = new Ok(2);
      const result = await (
        await input.async().map(async n => Promise.resolve(n * n))
      )
        .async()
        .map(async n =>
          Promise.resolve(
            [...range(n + 1)].reduce((a: number, b: number) => a + b, 0),
          ),
        );
      expect(result).toUnwrapEqual(10);
    });

    test('Err.map() => Err', async () => {
      const input = new Err<number, number>(2);
      const result = await input.async().map(async n => Promise.resolve(n * n));
      expect(result).toBeErr();
    });
  });

  describe('mapErr', () => {
    test('mapped async functions', async () => {
      const input = new Err(2);
      const result = await input
        .async()
        .mapErr(async n => Promise.resolve(n * n));
      expect(result).toUnwrapErrEqual(4);
    });

    test('chain mapped async functions', async () => {
      const input = new Err(2);
      const result = await (
        await input.async().mapErr(async n => Promise.resolve(n * n))
      )
        .async()
        .mapErr(async n =>
          Promise.resolve(
            [...range(n + 1)].reduce((a: number, b: number) => a + b, 0),
          ),
        );
      expect(result).toUnwrapErrEqual(10);
    });

    test('Ok.mapErr() => Ok', async () => {
      const input = new Ok<number, number>(2);
      const result = await input
        .async()
        .mapErr(async n => Promise.resolve(n * n));
      expect(result).toBeOk();
      expect(result).toUnwrapEqual(2);
    });
  });

  describe('mapOr', () => {
    test('Ok is mapped', async () => {
      expect(
        await new Ok<number, number>(2)
          .async()
          .mapOr(3, async n => Promise.resolve(n * 2)),
      ).toEqual(4);
    });

    test('Err is mapped', async () => {
      expect(
        await new Err<number, number>(2)
          .async()
          .mapOr(3, async n => Promise.resolve(n * 2)),
      ).toEqual(3);
    });

    test('Types are mapped', async () => {
      expect(
        await new Err<number, number>(2)
          .async()
          .mapOr('error', async n => Promise.resolve('test'.repeat(n))),
      ).toEqual('error');
    });
  });

  describe('mapOrElse', () => {
    test('Ok is mapped', async () => {
      expect(
        await new Ok<number, number>(2).async().mapOrElse(
          async e => Promise.resolve(e + 1),
          async n => Promise.resolve(n * 2),
        ),
      ).toEqual(4);
    });

    test('Err is mapped', async () => {
      expect(
        await new Err<number, number>(2).async().mapOrElse(
          async e => Promise.resolve(e + 1),
          async n => Promise.resolve(n * 2),
        ),
      ).toEqual(3);
    });

    test('Types are mapped', async () => {
      expect(
        await new Err<number, number>(2).async().mapOrElse(
          async e => Promise.resolve('e'.repeat(e)),
          async n => Promise.resolve('test'.repeat(n)),
        ),
      ).toEqual('ee');
    });
  });

  describe('andThen', () => {
    test('Ok.andThen(Ok) => Ok', async () => {
      const input = new Ok(2);
      const result = await input
        .async()
        .andThen(async val => Promise.resolve(new Ok('hi'.repeat(val))));
      expect(result).toUnwrapEqual('hihi');
    });

    test('Ok.andThen(Err) => Err', async () => {
      const input = new Ok(2);
      const result = await input
        .async()
        .andThen(async _ => Promise.resolve(new Err(undefined)));
      expect(result).toBeErr();
    });

    test('Err.andThen() => Err', async () => {
      const input = new Err<number, undefined>(undefined);
      const result = await input
        .async()
        .andThen(async _ => Promise.resolve(new Ok(12)));
      expect(result).toBeErr();
    });
  });

  describe('orElse', () => {
    test('Ok.orElse() => Ok', async () => {
      const input = new Ok(2);
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new Ok(0)));
      expect(result).toBeOk();
      expect(result).toUnwrapEqual(2);
    });

    test('Err.orElse(Err) => Err', async () => {
      const input = new Err(2);
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new Err(4)));
      expect(result).toBeErr();
      expect(result).toUnwrapErrEqual(4);
    });

    test('Err.orElse(Ok) => Ok', async () => {
      const input = new Err(2);
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new Ok(0)));
      expect(result).toBeOk();
      expect(result).toUnwrapEqual(0);
    });
  });

  describe('unwrapOrElse', () => {
    test('Ok.unwrapOrElse() => T', async () => {
      const input = new Ok(2);
      const result = await input
        .async()
        .unwrapOrElse(async () => Promise.resolve(0));
      expect(result).toEqual(2);
    });

    test('Err.unwrapOrElse(Fallback) => Fallback', async () => {
      const input = new Err(undefined);
      const result = await input
        .async()
        .unwrapOrElse(async () => Promise.resolve(0));
      expect(result).toEqual(0);
    });
  });
});
