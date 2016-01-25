DEFINE_MACRO(FOO, (a) => a);
DEFINE_MACRO(BAR, () => {
  var b = 'bar';
  return b;
});

export default function demo () {
  var a = "not-foo",
    b = "not-bar";
  return [FOO("foo"), BAR()];
}