if(1) {}

{
  if(1) {
    let a;
  }
  // A meaningless comment
  do{}while(1)
  ~~~~~~~~~~~~ [empty-line-around-statement]
  let a = 1;
  ~~~~~~~~~~ [empty-line-around-statement]
  if(1) {
  ~~~~~~~
    while(1){}
~~~~~~~~~~~~~~
  }
~~~ [empty-line-around-statement]
}
if (1) {
~~~~~~~~
}
~ [empty-line-around-statement]
if(2) {}
~~~~~~~~ [empty-line-around-statement]
function a() {
~~~~~~~~~~~~~~
}
~ [empty-line-around-statement]
class haha{
~~~~~~~~~~~
}
~ [empty-line-around-statement]

let a = 1;
function asd(as: number): number;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ [empty-line-around-statement]
function asd(as: string): void;
function asd(as: string | number): void|number{

}
function test(): void {}
~~~~~~~~~~~~~~~~~~~~~~~~ [empty-line-around-statement]

class Test{
  test(name: number): number;
  test(name: string): void;
  test(name: string|number): void|number{
  }
}

[empty-line-around-statement]: An empty line is expected before the statement.
=====================================================
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

function asd(as: number): number;
function asd(as: string): void;
function asd(as: string | number): void|number{

}

function test(): void {}

class Test{
  test(name: number): number;
  test(name: string): void;
  test(name: string|number): void|number{
  }
}