import {addElementsToSequentialArray} from '../library';

test('`addElementsToSequentialArray` should work with after anchor', () => {
  expect(
    addElementsToSequentialArray([1, 2, 3], [4, 5, 6], {
      isAfterAnchor(element) {
        return element === 2;
      },
    }),
  ).toEqual([1, 2, 4, 5, 6, 3]);

  expect(
    addElementsToSequentialArray([1, 2, 3, 4, 5], [6, 3, 4], {
      isAfterAnchor(element) {
        return element === 2;
      },
    }),
  ).toEqual([1, 2, 6, 3, 4, 5]);

  expect(
    addElementsToSequentialArray([1, 2, 3, 4, 5], [6, 3, 4], {
      isAfterAnchor(element) {
        return element < 3;
      },
    }),
  ).toEqual([1, 2, 6, 3, 4, 5]);
});

test('`addElementsToSequentialArray` should work with before anchor', () => {
  expect(
    addElementsToSequentialArray([1, 2, 3], [4, 5, 6], {
      isBeforeAnchor(element) {
        return element === 3;
      },
    }),
  ).toEqual([1, 2, 4, 5, 6, 3]);

  expect(
    addElementsToSequentialArray([1, 2, 3, 4, 5], [6, 3, 4], {
      isBeforeAnchor() {
        return false;
      },
    }),
  ).toEqual([1, 2, 3, 4, 5, 6]);

  expect(
    addElementsToSequentialArray([1, 2, 3, 4, 5], [6, 3, 4], {
      isBeforeAnchor() {
        return true;
      },
    }),
  ).toEqual([6, 1, 2, 3, 4, 5]);
});

test('`addElementsToSequentialArray` should work with after & before anchor', () => {
  expect(
    addElementsToSequentialArray([1, 2, 3], [4, 5, 6], {
      isAfterAnchor(element) {
        return element === 3;
      },
      isBeforeAnchor(element) {
        return element === 1;
      },
    }),
  ).toEqual([4, 5, 6, 1, 2, 3]);
});

test('`addElementsToSequentialArray` should work with replace option', () => {
  expect(
    addElementsToSequentialArray(['a1', 'b1', 'c1'], ['b2', 'd1'], {
      getKey(element) {
        return element[0];
      },
      isAfterAnchor(element) {
        return element.startsWith('a');
      },
      replace: true,
    }),
  ).toEqual(['a1', 'b2', 'd1', 'c1']);

  expect(
    addElementsToSequentialArray(['a1', 'b1', 'c1'], ['b2', 'd1'], {
      getKey(element) {
        return element[0];
      },
      isAfterAnchor(element) {
        return element.startsWith('a');
      },
    }),
  ).toEqual(['a1', 'b1', 'd1', 'c1']);

  expect(
    addElementsToSequentialArray(
      ['a1', 'b2', 'e3', 'c4'],
      ['b5', 'd6', 'e7', 'f8', 'g9'],
      {
        getKey(element) {
          return element[0];
        },
        isAfterAnchor(element) {
          return element.startsWith('a');
        },
        replace: true,
      },
    ),
  ).toEqual(['a1', 'b5', 'd6', 'e7', 'f8', 'g9', 'c4']);
});
