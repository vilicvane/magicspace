import {extendObjectProperties} from '../library';

test('`extendObjectProperties` should work without specify `after`/`before` option', () => {
  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          b: 4,
        },
      ),
    ),
  ).toEqual(
    json({
      a: 1,
      b: 4,
      c: 3,
    }),
  );

  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          b: 4,
          a: 5,
        },
      ),
    ),
  ).toEqual(
    json({
      a: 5,
      b: 4,
      c: 3,
    }),
  );

  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          b: 4,
          d: 5,
        },
      ),
    ),
  ).toEqual(
    json({
      a: 1,
      b: 4,
      c: 3,
      d: 5,
    }),
  );
});

test('`extendObjectProperties` should work with `after` option', () => {
  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          b: 4,
        },
        {
          after: 'c',
        },
      ),
    ),
  ).toEqual(
    json({
      a: 1,
      b: 4,
      c: 3,
    }),
  );

  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          d: 4,
        },
        {
          after: 'b',
        },
      ),
    ),
  ).toEqual(
    json({
      a: 1,
      b: 2,
      d: 4,
      c: 3,
    }),
  );

  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          c: 3,
        },
        {
          b: 4,
          a: 5,
        },
        {
          after: 'c',
        },
      ),
    ),
  ).toEqual(
    json({
      a: 5,
      b: 4,
      c: 3,
    }),
  );

  expect(
    json(
      extendObjectProperties(
        {
          a: 1,
          b: 2,
          e: 3,
          c: 4,
        },
        {
          b: 5,
          d: 6,
          e: 7,
          f: 8,
          g: 9,
        },
        {
          after: 'a',
        },
      ),
    ),
  ).toEqual(
    json({
      a: 1,
      b: 5,
      d: 6,
      e: 7,
      f: 8,
      g: 9,
      c: 4,
    }),
  );
});

function json(object: unknown): string {
  return JSON.stringify(object, undefined, 2);
}
