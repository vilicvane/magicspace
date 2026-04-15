declare module 'npm-path' {
  export const PATH: string;

  export function get(
    options: {cwd: string},
    callback: (error: unknown, path: string) => void,
  ): void;
}
