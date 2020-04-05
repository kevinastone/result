import {optionify, join, Option, Some, None} from '../src/option';
import expect from './matchers';

function* range(end: number, start = 0): IterableIterator<number> {
  for (let i = start; i < end; i += 1) {
    yield i;
  }
}

describe('optionify', () => {
  test('nonull => Some', () => {
    expect(optionify([])).toBeSome();
    expect(optionify('')).toBeSome();
    expect(optionify(0)).toBeSome();
    expect(optionify({})).toBeSome();
  });

  test('null => None', () => {
    expect(optionify(null)).toBeNone();
    expect(optionify(undefined)).toBeNone();
  });
});

describe('isSome', () => {
  test('Some.isSome() => true', () => {
    expect(new Some(undefined).isSome()).toBe(true);
  });

  test('None.isSome() => false', () => {
    expect(new None().isSome()).toBe(false);
  });
});

describe('isNone', () => {
  test('Some.isNone() => false', () => {
    expect(new Some(undefined).isNone()).toBe(false);
  });

  test('None.isNone() => true', () => {
    expect(new None().isNone()).toBe(true);
  });
});

describe('map', () => {
  test('Some is mapped', () => {
    expect(new Some(2).map(n => n * 2)).toUnwrapEqual(4);
  });

  test('Types are mapped', () => {
    expect(new Some(2).map(n => 'test'.repeat(n))).toUnwrapEqual('testtest');
  });

  test("None doesn't call map", () => {
    const fn = jest.fn(x => x * x);
    new None().map(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('mapNullable', () => {
  test('Some is mapped', () => {
    expect(new Some(2).mapNullable(n => n * 2)).toUnwrapEqual(4);
  });

  test('Some -> Null => None', () => {
    expect(new Some(2).mapNullable(n => (n > 4 ? n : null))).toBeNone();
  });

  test('Types are mapped', () => {
    expect(new Some(2).mapNullable(n => 'test'.repeat(n))).toUnwrapEqual(
      'testtest',
    );
  });

  test("None doesn't call mapNullable", () => {
    const fn = jest.fn(x => x * x);
    new None().mapNullable(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('mapOr', () => {
  test('Some is mapped', () => {
    expect(new Some('test').mapOr(0, val => val.length)).toUnwrapEqual(4);
  });

  test('None uses default', () => {
    expect(new None<string>().mapOr(0, val => val.length)).toUnwrapEqual(0);
  });
});

describe('mapOrElse', () => {
  test('Some is mapped', () => {
    expect(
      new Some<number>(2).mapOrElse(
        () => 0,
        n => n * 2,
      ),
    ).toEqual(4);
  });

  test('None is mapped', () => {
    expect(
      new None<number>().mapOrElse(
        () => 0,
        n => n * 2,
      ),
    ).toEqual(0);
  });

  test('Types are mapped', () => {
    expect(
      new None<number>().mapOrElse(
        () => 'missing',
        n => 'test'.repeat(n),
      ),
    ).toEqual('missing');
  });
});

describe('filter', () => {
  test('Some.filter(true) => Some', () => {
    expect(new Some('test').filter(val => val.length > 0)).toBeSome();
  });

  test('Some.filter(false) => None', () => {
    expect(new Some('').filter(val => val.length > 0)).toBeNone();
  });

  test('None.filter() => None', () => {
    expect(new None<string>().filter(val => val.length > 0)).toBeNone();
  });
});

describe('and', () => {
  test('Some chained to an Some', () => {
    expect(new Some(2).and(new Some(undefined))).toBeSome();
  });

  test('Some chained to an None', () => {
    expect(new Some(2).and(new None())).toBeNone();
  });

  test('None chained to an Some', () => {
    expect(new None().and(new Some(undefined))).toBeNone();
  });

  test('Some is chained', () => {
    expect(new Some(2).and(new Some('good'))).toUnwrapEqual('good');
  });
});

describe('andThen', () => {
  test('Some chained to an Some', () => {
    expect(new Some(2).andThen(_ => new Some(undefined))).toBeSome();
  });

  test('Some chained to an None', () => {
    expect(new Some(2).andThen(_ => new None())).toBeNone();
  });

  test('Some is chained', () => {
    expect(new Some(2).andThen(n => new Some('good'.repeat(n)))).toUnwrapEqual(
      'goodgood',
    );
  });

  test("None doesn't chain", () => {
    const fn = jest.fn((x: number): Option<number> => new Some(x * x));
    new None<number>().andThen(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('or', () => {
  test('Some chained to an Some', () => {
    expect(new Some(2).or(new None())).toBeSome();
  });

  test('Some chained to an None', () => {
    expect(new Some(2).or(new None())).toBeSome();
  });

  test('None chained to an Some', () => {
    expect(new None().or(new Some(undefined))).toBeSome();
  });

  test("Some doesn't chained", () => {
    expect(new Some(2).or(new None())).toUnwrapEqual(2);
  });
});

describe('orElse', () => {
  test('Some chained to an Some', () => {
    expect(new Some(2).orElse(() => new None<number>())).toBeSome();
  });

  test('Some chained to an None', () => {
    expect(new Some(2).orElse(() => new None<number>())).toBeSome();
  });

  test('None chains to Some', () => {
    expect(new None().orElse(() => new Some(2))).toBeSome();
  });

  test('None chains', () => {
    const fn = jest.fn((): Option<number> => new Some(34));
    new None<number>().orElse(fn);
    expect(fn).toHaveBeenCalled();
  });
});

describe('xor', () => {
  test('Some chained to a Some to be None', () => {
    expect(new Some(1).xor(new Some(2))).toBeNone();
  });

  test('Some chained to a None to be Some', () => {
    const result = new Some(1).xor(new None());
    expect(result).toBeSome();
    expect(result).toUnwrapEqual(1);
  });

  test('None chained to a Some to be Some', () => {
    const result = new None<number>().xor(new Some(2));
    expect(result).toBeSome();
    expect(result).toUnwrapEqual(2);
  });

  test('None chained to a None to be None', () => {
    expect(new None<number>().xor(new None<number>())).toBeNone();
  });
});

describe('okOr', () => {
  test('Some => Ok', () => {
    expect(new Some(undefined).okOr('error')).toBeOk();
  });

  test('None => Err', () => {
    expect(new None().okOr('error')).toBeErr();
  });
});

describe('okOrElse', () => {
  test('Some => Ok', () => {
    expect(new Some(undefined).okOrElse(() => 'error')).toBeOk();
  });

  test('None => Err', () => {
    expect(new None().okOrElse(() => 'error')).toBeErr();
  });
});

describe('unwrap', () => {
  test('Some => T', () => {
    expect(new Some(2).unwrap()).toBe(2);
  });

  test('None => Exception', () => {
    expect(() => new None().unwrap()).toThrow();
  });
});

describe('unwrapNullable', () => {
  test('Some => T', () => {
    expect(new Some(2).unwrapNullable()).toBe(2);
  });

  test('None => null', () => {
    expect(new None().unwrapNullable()).toBeNull();
  });
});

describe('unwrapOr', () => {
  test('Some => Value', () => {
    expect(new Some(2).unwrapOr(3)).toBe(2);
  });

  test('None => Or', () => {
    expect(new None<number>().unwrapOr(3)).toBe(3);
  });
});

describe('unwrapOrElse', () => {
  test('Some => Value', () => {
    expect(new Some(2).unwrapOrElse(() => 3)).toBe(2);
  });

  test('None => Or', () => {
    expect(new None().unwrapOrElse(() => 3)).toBe(3);
  });
});

describe('AsyncOption', () => {
  describe('map', () => {
    test('mapped async functions', async () => {
      const input = new Some(2);
      const result = await input.async().map(async n => Promise.resolve(n * n));
      expect(result).toUnwrapEqual(4);
    });

    test('chain mapped async functions', async () => {
      const input = new Some(2);
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

    test('None.map() => None', async () => {
      const input = new None<number>();
      const result = await input.async().map(async n => Promise.resolve(n * n));
      expect(result).toBeNone();
    });
  });

  describe('mapNullable', () => {
    test('mapped async functions', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .mapNullable(async n => Promise.resolve(n * n));
      expect(result).toUnwrapEqual(4);
    });

    test('chain mapped async functions', async () => {
      const input = new Some(2);
      const result = await (
        await input.async().mapNullable(async n => Promise.resolve(n * n))
      )
        .async()
        .mapNullable(async n =>
          Promise.resolve(
            [...range(n + 1)].reduce((a: number, b: number) => a + b, 0),
          ),
        );
      expect(result).toUnwrapEqual(10);
    });

    test('None.mapNullable() => None', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .mapNullable(async n => Promise.resolve(n * n));
      expect(result).toBeNone();
    });
  });

  describe('filter', () => {
    test('Some.filter(true) => Some', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .filter(async _ => Promise.resolve(true));
      expect(result).toUnwrapEqual(2);
    });

    test('Some.filter(false) => None', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .filter(async _ => Promise.resolve(false));
      expect(result).toBeNone();
    });

    test('None.filter() => None', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .filter(async _ => Promise.resolve(true));
      expect(result).toBeNone();
    });
  });

  describe('andThen', () => {
    test('Some.andThen(Some) => Some', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .andThen(async val => Promise.resolve(new Some('hi'.repeat(val))));
      expect(result).toUnwrapEqual('hihi');
    });

    test('Some.andThen(None) => None', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .andThen(async _ => Promise.resolve(new None()));
      expect(result).toBeNone();
    });

    test('None.andThen() => None', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .andThen(async _ => Promise.resolve(new Some(12)));
      expect(result).toBeNone();
    });
  });

  describe('orElse', () => {
    test('Some.orElse() => Some', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new Some(0)));
      expect(result).toBeSome();
      expect(result).toUnwrapEqual(2);
    });

    test('None.orElse(None) => None', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new None<number>()));
      expect(result).toBeNone();
    });

    test('None.orElse(Some) => Some', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .orElse(async () => Promise.resolve(new Some(0)));
      expect(result).toBeSome();
      expect(result).toUnwrapEqual(0);
    });
  });

  describe('okOrElse', () => {
    test('Some.okOrElse() => Ok', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .okOrElse(async () => Promise.resolve(new Some(0)));
      expect(result).toBeOk();
      expect(result).toUnwrapEqual(2);
    });

    test('None.okOrElse() => Err', async () => {
      const error = new Error('test');
      const input = new None<number>();
      const result = await input
        .async()
        .okOrElse(async () => Promise.resolve(error));
      expect(result).toBeErr();
      expect(result).toUnwrapErrEqual(error);
    });
  });

  describe('unwrapOrElse', () => {
    test('Some.unwrapOrElse() => T', async () => {
      const input = new Some(2);
      const result = await input
        .async()
        .unwrapOrElse(async () => Promise.resolve(0));
      expect(result).toEqual(2);
    });

    test('None.unwrapOrElse(Fallback) => Fallback', async () => {
      const input = new None<number>();
      const result = await input
        .async()
        .unwrapOrElse(async () => Promise.resolve(0));
      expect(result).toEqual(0);
    });
  });
});

describe('join', () => {
  test('Some chained to a Some to be Some', () => {
    const result = join(new Some(1), new Some(2));
    expect(result).toBeSome();
    expect(result).toUnwrapEqual([1, 2]);
  });

  test('Some chained to a None to be None', () => {
    expect(join(new Some(1), new None())).toBeNone();
  });

  test('None chained to a Some to be None', () => {
    expect(join(new None<number>(), new Some(2))).toBeNone();
  });

  test('None chained to a None to be None', () => {
    expect(join(new None<number>(), new None<number>())).toBeNone();
  });

  test('Multiple chains of Somes to be Some', () => {
    const result = join(new Some(1), new Some(2), new Some(3), new Some(4));
    expect(result).toBeSome();
    expect(result).toUnwrapEqual([1, 2, 3, 4]);
  });

  test('Nones in chain to result in None', () => {
    const result = join(new Some(1), new Some(2), new None(), new Some(4));
    expect(result).toBeNone();
  });
});
