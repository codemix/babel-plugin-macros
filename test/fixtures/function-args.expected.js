

export default function demo() {
  let _foo;

  let _func;

  _func = 'foo1';
  _foo = _func;

  let _bar;

  let _func2;

  _func2 = 'bar1';
  _bar = _func2;

  let _func3;

  _func3 = 'baz1';

  let _foo2;

  let _func4;

  _func4 = 'foo2';
  _foo2 = _func4;

  let _bar2;

  let _func5;

  _func5 = 'bar2';
  _bar2 = _func5;

  let _func6;

  _func6 = 'baz2';

  let _foo3;

  _foo3 = 'foo3';

  let _bar3;

  _bar3 = 'bar3';

  return [_foo, _bar, _func3, _foo2, _bar2, _func6, _foo3, _bar3, 'baz3'];
}