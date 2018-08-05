import * as Path from 'path';

export function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}

// 找出两个数组的不相同的元素
export function findDiffEleInArrays(arrA: string[], arrB: string[]): string[] {
  return arrA
    .concat(arrB)
    .filter(item => !arrA.includes(item) || !arrB.includes(item));
}

export function removeFileNameSuffix(fileName: string) {
  return Path.basename(fileName, Path.extname(fileName));
}

export function toRelativeCurrentPath(fileName: string) {
  return `./${fileName}`;
}

export function removeModuleFileExtension(fileName: string): string {
  return fileName.replace(/\.(?:(?:js|ts)x?|d\.ts)?$/i, '');
}

export function removeFileNameExtension(fileName: string) {
  return Path.basename(fileName, Path.extname(fileName));
}
