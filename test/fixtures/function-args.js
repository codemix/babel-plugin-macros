DEFINE_MACRO(FOO, function (func) {
  return func();
});
DEFINE_MACRO(BAR, (func) => {
  return func();
});
DEFINE_MACRO(BAZ, (func) => func());


export default function demo() {
  return [
    FOO(function () {return 'foo1'}), BAR(function () {return 'bar1'}), BAZ(function () {return 'baz1'}),
    FOO(() => {return 'foo2'}), BAR(() => {return 'bar2'}), BAZ(()=> {return 'baz2'}),
    FOO(() => 'foo3'), BAR(() => 'bar3'), BAZ(()=> 'baz3')
  ];
}