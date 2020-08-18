import _ from 'lodash';

export interface AddElementsToSequentialArrayOptions<T> {
  getKey?(element: T): unknown;
  isAfterAnchor?(element: T): boolean;
  isBeforeAnchor?(element: T): boolean;
  replace?: boolean;
}

export function addElementsToSequentialArray<T>(
  array: T[],
  elements: T[],
  {
    getKey = (element): T => element,
    isAfterAnchor,
    isBeforeAnchor,
    replace: toReplace = false,
  }: AddElementsToSequentialArrayOptions<T> = {},
): T[] {
  let existingKeyToElementMap = new Map(
    array.map(element => [getKey(element), element]),
  );

  let newElements: T[] = [];

  for (let element of elements) {
    let key = getKey(element);

    if (existingKeyToElementMap.has(key)) {
      if (toReplace) {
        existingKeyToElementMap.set(key, element);
      }
    } else {
      newElements.push(element);
    }
  }

  let existingElements = Array.from(existingKeyToElementMap.values());

  if (newElements.length === 0) {
    return existingElements;
  }

  let afterHitIndex = -1;
  let beforeHitIndex = -1;

  for (let [index, element] of existingElements.entries()) {
    // If `after` option is present, and if there's no after hit yet
    // (afterHitIndex < 0) or if the last after hit is just the former entry
    // (index - afterHitIndex === 1).
    if (isAfterAnchor && (afterHitIndex < 0 || index - afterHitIndex === 1)) {
      let afterHit = isAfterAnchor(element);

      if (afterHit) {
        afterHitIndex = index;
      } else if (afterHitIndex >= 0) {
        // If we already had a hit, and this one is not hit, then we can safely
        // end searching.
        break;
      }
    }

    if (isBeforeAnchor && beforeHitIndex < 0) {
      let beforeHit = isBeforeAnchor(element);

      if (beforeHit) {
        beforeHitIndex = index;
        break;
      }
    }
  }

  if (afterHitIndex >= 0) {
    let matchingElements: T[] = [];

    let remainingNewElements = [...newElements];
    let remainingAfterAnchorElements = existingElements.slice(
      afterHitIndex + 1,
    );

    let candidateElementsArray = [
      remainingNewElements,
      remainingAfterAnchorElements,
    ];

    outer: for (let element of elements) {
      let key = getKey(element);

      for (let candidateElements of candidateElementsArray) {
        if (
          candidateElements.length > 0 &&
          getKey(candidateElements[0]) === key
        ) {
          matchingElements.push(candidateElements.shift()!);
          continue outer;
        }
      }

      break;
    }

    return [
      ...existingElements.slice(0, afterHitIndex + 1),
      ...matchingElements,
      ...remainingNewElements,
      ...remainingAfterAnchorElements,
    ];
  } else if (beforeHitIndex >= 0) {
    array.splice(beforeHitIndex, 0, ...newElements);

    return [
      ...existingElements.slice(0, beforeHitIndex),
      ...newElements,
      ...existingElements.slice(beforeHitIndex),
    ];
  } else {
    return [...existingElements, ...newElements];
  }
}
