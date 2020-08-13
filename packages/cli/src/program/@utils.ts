export function compact<T>(
  values: T[],
): Exclude<T, undefined | null | false | 0 | ''>[];
export function compact(values: unknown[]): unknown[] {
  return values.filter(value => !!value);
}
