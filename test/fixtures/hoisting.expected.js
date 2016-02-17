const { bar, baz } = function () {
  function bar() {
    return "bar";
  }

  const baz = function () {
    return function baz() {
      return "baz";
    };
  }();
  return { bar, baz };
}();

export default function demo() {
  return [bar(), baz()];
}