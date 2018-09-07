type CompareString = 'Object' | 'Function' | 'Array' | 'Boolean' | 'Number';

export function XTypeof<T>(
  target: any,
  compareString: CompareString,
): target is T {
  return Object.prototype.toString.call(target) === `[object ${compareString}]`;
}
