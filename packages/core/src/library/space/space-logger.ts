// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SpaceLoggerEvent = {
  type: 'loaded-composable-module';
  path: string;
};

export interface SpaceLogger {
  info(event: SpaceLoggerEvent): void;
  stdout(text: string | Buffer): void;
  stderr(text: string | Buffer): void;
}
