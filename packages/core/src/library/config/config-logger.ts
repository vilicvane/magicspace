// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ConfigLoggerEvent = {
  type: 'resolve-boilerplate';
  path: string;
};

export interface ConfigLogger {
  info(event: ConfigLoggerEvent): void;
}
