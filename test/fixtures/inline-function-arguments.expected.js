
export default function demo() {
  let _foo;

  var _deep = new Error('qwe').stack.split('\n').length,
      _deep2 = new Error('asd').stack.split('\n').length;
  _foo = _deep2 - _deep;

  let _bar;

  var _deep3 = new Error('qwe').stack.split('\n').length,
      _deep4 = new Error('qwe').stack.split('\n').length;
  _bar = _deep4 - _deep3;

  let _foo2;

  var _deep5 = new Error('qwe').stack.split('\n').length,
      _deep6 = new Error('asd').stack.split('\n').length;_foo2 = _deep6 - _deep5;

  let _bar2;

  var _deep7 = new Error('qwe').stack.split('\n').length,
      _deep8 = new Error('qwe').stack.split('\n').length;_bar2 = _deep8 - _deep7;

  return [_foo, _bar, _foo2, _bar2];
}