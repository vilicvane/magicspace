if(1) {}
~~~~~~~~ [empty-line-around-statements]


{
  if(1) {
    let a;
  }
  //ADWADASDAWD
  do{}while(1)
  ~~~~~~~~~~~~ [empty-line-around-statements]
  let a = 1;
  ~~~~~~~~~~ [empty-line-around-statements]
}
if(1) {
~~~~~~~
  let a;
~~~~~~~~
}
~ [empty-line-around-statements]

[empty-line-around-statements]: Enough empty lines should be left around the statement.
=====================================================
if(1) {}

{
  if(1) {
    let a;
  }

  //ADWADASDAWD
  do{}while(1)

  let a = 1;
}

if(1) {
  let a;
}
