export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function uniqueBy<T, TKey>(
  values: T[],
  keyCallback: (value: T) => TKey,
): T[] {
  let map = new Map<TKey, T>();

  for (let value of values) {
    let key = keyCallback(value);

    if (!map.has(key)) {
      map.set(key, value);
    }
  }

  return Array.from(map.values());
}
