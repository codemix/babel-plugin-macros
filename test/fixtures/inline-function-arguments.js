DEFINE_MACRO(FOO, (inner) => {
  var deep1 = new Error('qwe').stack.split('\n').length,
    deep2 = inner(()=>new Error('asd').stack.split('\n').length);
  return deep2 - deep1;
});

DEFINE_MACRO(BAR, (inner) => {
  var deep1 = ERROR(),
    deep2 = inner(() => ERROR());
  return deep2 - deep1;
  DEFINE_MACRO(ERROR, ()=> new Error('qwe').stack.split('\n').length);
});
export default function demo() {
  return [FOO(fn=>fn()), BAR(fn=>fn()), FOO(fn=>INNER(fn)), BAR(fn=>INNER(fn))];
  DEFINE_MACRO(INNER, fn=>fn())
}