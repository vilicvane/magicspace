function foo() {}
let foo = () => {};
let foo = {
  bar() {},
};

class Foo {
  bar() {}

  _age = 1
  get age(){
    return this._age;
  }
}

let foo: Foo = () => {};

let foo: Foo = {
  bar() {},
};

let foo: Foo = {
  bar() {},
  pia: () => {},
  hia: function() {},
};

let foo = {
  bar() {},
  pia: () => {},
  hia: function() {},
};

let foo: Foo = () => true;
let foo: Foo = () => () => true;
let foo = (): Foo => () => {
  return true;
};

let foo = () => (): Foo => true;

foo.bar = () => {};
bar = () => true;

map(() => {});
map(() => () => true);
map({foo: () => () => true});

`${props => true}`;
let foo = `${props => true}`;

function foo(): any {
  if (true) {
    return () => {};
  }
}

new foo(() => {})

async function foo1() {}

async function foo2() {
  return 1;
}

async function foo3() {
  return "string";
}

async function foo4() {
  return new Promise<number>(resolve => {resolve(1);});
}
