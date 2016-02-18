

export default function demo() {
  let _foo;

  let _bar2;

  _bar2 = ["bar"].concat("baz");
  _foo = ["foo"].concat(_bar2);

  return _foo;
}