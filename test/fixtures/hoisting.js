const {bar, baz} = (function () {
  DEFINE_MACRO(FOO, () => "bar");
  function bar() {
    return FOO();
  }

  const baz = (function () {
    DEFINE_MACRO(FOO, () => "baz");
    return function baz() {
      return FOO();
    };
  })();
  return {bar, baz};
})();

export default function demo() {
  return [bar(), baz()];
}
