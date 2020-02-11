// eslint-disable-next-line @magicspace/import-groups
import {rules} from '../rules';

import {RuleTester} from './@utils';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run('no-empty-constructor', rules['no-empty-constructor'], {
  valid: [
    {
      code: `
class Foo{
  constructor(name:string) { }
}
            `,
    },
    {
      code: `
class Foo {
  private constructor() { }
}
            `,
    },
    {
      code: `
class Foo {
  protected constructor() { }
}
            `,
    },
    {
      code: `
class Foo {
  constructor(private bar:string) { }

  bar():void{}
}
            `,
    },
    {
      code: `
class Foo {
  constructor(protected bar:string) { }
}
            `,
    },
    {
      code: `
class Foo{
  constructor(public bar:string) { }
}
            `,
    },
    {
      code: `
class Foo{
  constructor(public bar:string, age:number) { }
}
            `,
    },
    {
      code: `
class Foo{
  constructor(name:string){ }
}
            `,
    },
    {
      code: `
class Foo{
  constructor() {
    console.info('bar')
    let a = 1
    let b = 1
  }
}
            `,
    },
  ],
  invalid: [
    {
      code: `
class Foo {
  constructor() { }
}
            `,
      errors: [{messageId: 'emptyConstructor'}],
    },
    {
      code: `
class Foo {
  public constructor() { }
}
            `,
      errors: [{messageId: 'emptyConstructor'}],
    },
  ],
});
