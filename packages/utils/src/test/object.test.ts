import {extendObjectProperties, sortObjectKeys} from '../library';

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

test('`sortObjectKeys` should work', () => {
  expect(
    json(
      sortObjectKeys(
        {
          foo: 1,
          yo: 'a',
          bar: 2,
          ha: 'b',
        },
        ['foo', 'bar'],
      ),
    ),
  ).toEqual(
    json({
      foo: 1,
      bar: 2,
      yo: 'a',
      ha: 'b',
    }),
  );

  expect(
    json(
      sortObjectKeys(
        {
          foo: 1,
          yo: 'a',
          bar: 2,
          ha: 'b',
        },
        ['yo', 'ha'],
      ),
    ),
  ).toEqual(
    json({
      yo: 'a',
      ha: 'b',
      foo: 1,
      bar: 2,
    }),
  );

  expect(
    json(
      sortObjectKeys(
        {
          foo: 1,
          yo: 'a',
          bar: 2,
          ha: 'b',
        },
        {
          top: ['yo'],
          bottom: ['bar'],
        },
      ),
    ),
  ).toEqual(
    json({
      yo: 'a',
      foo: 1,
      ha: 'b',
      bar: 2,
    }),
  );

  expect(
    json(
      sortObjectKeys(
        {
          foo: 1,
          yo: {
            a: 'a',
            b: 'b',
          },
          bar: 2,
          ha: 'b',
        },
        {
          top: ['yo'],
          bottom: ['bar'],
        },
      ),
    ),
  ).toEqual(
    json({
      yo: {
        a: 'a',
        b: 'b',
      },
      foo: 1,
      ha: 'b',
      bar: 2,
    }),
  );

  expect(
    json(
      sortObjectKeys(
        {
          foo: 1,
          yo: {
            a: 'a',
            b: 'b',
          },
          bar: 2,
          ha: 'b',
        },
        {
          top: [
            {
              key: 'yo',
              subKeys: {
                bottom: ['a'],
              },
            },
          ],
          bottom: ['bar'],
        },
      ),
    ),
  ).toEqual(
    json({
      yo: {
        b: 'b',
        a: 'a',
      },
      foo: 1,
      ha: 'b',
      bar: 2,
    }),
  );
});

function json(object: unknown): string {
  return JSON.stringify(object, undefined, 2);
}
