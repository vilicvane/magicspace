if(1) {}

{
  if(1) {
    let a;
  }
  // A meaningless comment
  do{}while(1)
  let a = 1;
  if(1) {
    while(1){}
  }
}
if (1) {
}
if(2) {}
function a() {
}
class haha{
}

let a = 1;
function foo(arg: number): number;
function foo(arg: string): void;
function foo(arg: string | number): void|number{

}
function test(): void {}

class Test{
  test(){}
  a = 1;
}

class Test{
  hello: string = '1';
  test(name: number): number;
  test(name: string): void;
  test(name: string|number): void|number{
  }
}

if(1){
  {}
  let value = 1;
}

if(1){
  let value = 1;
  {}
}

if(1){
  {}
}
if(1){
}else if(0){
  alert('haha!');
}

const obj = {
    methodA(path){
    },
    methodB(name){
    }
}

class Test{
  arrowProp = () => {};
  arrowProp2 = () => {};
}

class Test{
  a = 2;
  arrowProp = () => {};
}

class Test{
  arrowProp = () => {};
  a = 2;
}

outer:
for(let i=0; i<4; i++){
  break outer;
}
console.log(1);
outer:
while(1){
  break outer;
}

outer:
if(1){
  break outer;
}

class Test{
  constructor(name:string);
  constructor(name:string){

  }
}

class Test{
  a = 1;
  constructor(name:string);
  constructor(name:string){

  }
}

function foo(){
  return 'hello';
}

function foo(){
  return {
    name: 'foo',
    args: undefined
  };
}

function foo(){
  let name = 'foo';
  return {
    name,
    args: undefined
  };
}

function foo(){
  let name = 'foo';
  return 'foo';
}

function foo(){
    let value = 2;

    switch(value){
        case 1:
            return {
                a: 2,
                b: 3,
            };
        case 4:
            let a = 2;
            return {
                a: 2,
                b: 3,
            };
        default:
            return {
                a: 2,
                b: 3,
            };
    }

    switch(value){
        default:
            let a = 1;
            return {
                a,
                b: 3,
            };
    }
}

let oneClass = class{
  constructor(){}
}

let oneClass = class{
  prop = 1;
  constructor(){}
}

let oneClass = class{
  foo(): void {

  }
}

let oneClass = class{
  prop = 1;
  foo(): void {
  }
}

class Test {
  get name() {
    return "test";
  }
  get age() {
    return 1;
  }
}

class Test{
  name = '';
  get name() {
    return "test";
  }
  set name(name: string){
    this.name = name;
  }
}

let a = 1;
// let b = 1;

class Test {
  age = 1;
}

