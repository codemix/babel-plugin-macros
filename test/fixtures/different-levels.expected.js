const parent0 = function () {
  return function () {
    let _foo;

    _foo = 'same level used';

    return _foo;
  };
}();
const parent1 = function () {
  return function () {
    let _foo2;

    _foo2 = 'parent level used';

    return _foo2;
  };
}();
const parent2 = function () {
  return function () {
    return function () {
      let _foo3;

      _foo3 = 'parent-parent level used';

      return _foo3;
    };
  }();
}();

const child = function () {
  return function () {
    function innerNotCalled() {}
    try {
      return FOO();
    } catch (e) {
      if (e.message === 'FOO is not defined') {
        return 'child level cannot used';
      } else {
        throw e;
      }
    }
  };
}();

const child1 = function () {
  return function () {
    try {
      return FOO();
    } catch (e) {
      if (e.message === 'FOO is not defined') {
        return 'child level cannot used';
      } else {
        throw e;
      }
    }
  };
}();

export default function demo() {
  return [parent0(), parent1(), parent2(), child(), child1()];
}