function f1() {
  DEFINE_MACRO(FOO, ()=> "outer")
  return function() {
    DEFINE_MACRO(FOO, ()=> "inner")
    return FOO();
  };
}
function f2() {
  DEFINE_MACRO(FOO, ()=> "outer")
  return function() {
    return FOO();
    DEFINE_MACRO(FOO, ()=> "inner")
  };
}

export default function demo() {
  return [f1()(), f2()()];
}