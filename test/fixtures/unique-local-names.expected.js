

export default function demo() {
  var foo = 'foo-main';

  let _foo;

  var _foo2 = 'foo1';
  _foo = _foo2;

  let _foo3;

  var _foo4;
  _foo3 = _foo4;
  return [_foo, _foo3, foo];
}