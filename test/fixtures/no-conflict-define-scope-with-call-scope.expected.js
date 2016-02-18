

export default function demo() {
  var a = "not-foo",
      b = "not-bar";
  const _a = "foo";

  let _bar;

  var _b = 'bar';
  _bar = _b;
  return [_a, _bar];
}