import 'prompts';

declare module 'prompts' {
  interface PromptObject {
    instructions?: boolean;
  }
}
