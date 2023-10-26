import 'prompts';

declare module 'prompts' {
  type PromptObject = {
    instructions?: boolean;
  };
}
