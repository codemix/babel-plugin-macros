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
DEFINE_MACRO(BAR, function(arg1) {
  var var1 = 'bar-var';
  var func = function func() {
    var arg1 = 'inner-bar',
      var1 = 'inner-bar-var';
    return [arg1, var1];
  };
  return [arg1, var1].concat(func());
});
DEFINE_MACRO(BAZ, function(arg1) {
  var var1 = 'baz-var';
  var func = () => {
    var arg1 = 'inner-baz',
      var1 = 'inner-baz-var';
    return [arg1, var1];
  };
  return [arg1, var1].concat(func());
});

export default function demo() {
  return [/*FOO('foo-arg'), */BAR('bar-arg'), BAZ('baz-arg')];
}
