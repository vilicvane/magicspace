import type {BoilerplatePostcomposeScriptContext} from '../boilerplate/index.js';

export type SpaceLoggerEvent =
  | {
      type: 'loaded-composable-module';
      path: string;
    }
  | {
      type: 'run-lifecycle-script';
      lifecycle: string;
      script:
        | string
        | ((context: BoilerplatePostcomposeScriptContext) => Promise<void>);
    };

export type SpaceLogger = {
  info(event: SpaceLoggerEvent): void;
  stdout(text: string | Buffer): void;
  stderr(text: string | Buffer): void;
};
