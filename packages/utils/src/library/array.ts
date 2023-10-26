export type AddElementsToSequentialArrayOptions<T> = {
  getKey?(element: T): unknown;
  isAfterAnchor?(element: T): boolean;
  isBeforeAnchor?(element: T): boolean;
  replace?: boolean;
};

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
  const existingKeyToElementMap = new Map(
    array.map(element => [getKey(element), element]),
  );

  const newElements: T[] = [];

  for (const element of elements) {
    const key = getKey(element);

    if (existingKeyToElementMap.has(key)) {
      if (toReplace) {
        existingKeyToElementMap.set(key, element);
      }
    } else {
      newElements.push(element);
    }
  }

  const existingElements = Array.from(existingKeyToElementMap.values());

  if (newElements.length === 0) {
    return existingElements;
  }

  let afterHitIndex = -1;
  let beforeHitIndex = -1;

  for (const [index, element] of existingElements.entries()) {
    // If `after` option is present, and if there's no after hit yet
    // (afterHitIndex < 0) or if the last after hit is just the former entry
    // (index - afterHitIndex === 1).
    if (isAfterAnchor && (afterHitIndex < 0 || index - afterHitIndex === 1)) {
      const afterHit = isAfterAnchor(element);

      if (afterHit) {
        afterHitIndex = index;
      } else if (afterHitIndex >= 0) {
        // If we already had a hit, and this one is not hit, then we can safely
        // end searching.
        break;
      }
    }

    if (isBeforeAnchor && beforeHitIndex < 0) {
      const beforeHit = isBeforeAnchor(element);

      if (beforeHit) {
        beforeHitIndex = index;
        break;
      }
    }
  }

  if (afterHitIndex >= 0) {
    const matchingElements: T[] = [];

    const remainingNewElements = [...newElements];
    const remainingAfterAnchorElements = existingElements.slice(
      afterHitIndex + 1,
    );

    const candidateElementsArray = [
      remainingNewElements,
      remainingAfterAnchorElements,
    ];

    outer: for (const element of elements) {
      const key = getKey(element);

      for (const candidateElements of candidateElementsArray) {
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
