DEFINE_MACRO(FOO, function(arg1) {
  function func() {
    return 'foo';
  }
  return func();
});

export default function demo() {
  return [FOO()];
}
