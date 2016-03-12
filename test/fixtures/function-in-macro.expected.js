// @todo unlock this test
//DEFINE_MACRO(FOO, function(arg1) {
//  var var1 = 'foo-var';
//  function func() {
//    var arg1 = 'inner-foo',
//      var1 = 'inner-foo-var';
//    return [arg1, var1];
//  }
//  return [arg1, var1].concat(func());
//});


export default function demo() {
  const _arg = 'bar-arg';

  let /*FOO('foo-arg'), */_bar;

  _BAR: {
    var _var = 'bar-var';
    var _func = function func() {
      var arg1 = 'inner-bar',
          var1 = 'inner-bar-var';
      return [arg1, var1];
    };
    _bar = [_arg, _var].concat(_func());
  }

  const _arg2 = 'baz-arg';

  let _baz;

  _BAZ: {
    var _var2 = 'baz-var';
    var _func2 = () => {
      var arg1 = 'inner-baz',
          var1 = 'inner-baz-var';
      return [arg1, var1];
    };
    _baz = [_arg2, _var2].concat(_func2());
  }

  return [_bar, _baz];
}