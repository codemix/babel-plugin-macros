function f1() {
  let _foo;

  _foo = ["foo", "bar", "quux"];

  return _foo;
}
function f2() {
  let _baz;

  _baz = ["baz", "bat", "quux"];

  return _baz;
}
function f3() {
  return QWE(() => "quux");
  function QWE(fn) {
    return ["qwe", "asd", fn()];
  }
}

export default function demo() {
  return [f1(), f2(), f3()];
}