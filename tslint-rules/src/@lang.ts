export interface Dict<T> {
  [key: string]: T;
}

export const BASE_TYPES = [
  "boolean",
  "number",
  "string",
  "array",
  "tuple",
  "null",
  "undefined",
  "never",
  "void"
]
