import {AssertTrue, IsCompatible} from 'tslang';

declare global {
  namespace Magicspace {
    interface TemplateOptions {}
  }
}

// @ts-ignore
type __AssertTemplateOptions =
  // All option of TemplateOptions must be optional.
  AssertTrue<IsCompatible<{}, Magicspace.TemplateOptions>>;
