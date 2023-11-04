export type SpaceLoggerEvent =
  | {
      type: 'loaded-composable-module';
      path: string;
    }
  | {
      type: 'run-lifecycle-script';
      lifecycle: string;
      script: string;
    };

export type SpaceLogger = {
  info(event: SpaceLoggerEvent): void;
  stdout(text: string | Buffer): void;
  stderr(text: string | Buffer): void;
};
