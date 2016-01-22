DEFINE_MACRO(FOO1, () => {
  var foo = 'foo1';
  return foo;
});
DEFINE_MACRO(FOO2, () => {
  var foo;
  return foo;
});

export default function demo () {
  var foo = 'foo-main';
  return [FOO1(), FOO2(), foo];
}