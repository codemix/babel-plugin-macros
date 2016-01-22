const parent0 = (function() {
  return function() {
    DEFINE_MACRO(FOO, function() {
      return 'same level used';
    });
    return FOO();
  };
})();
const parent1 = (function() {
  DEFINE_MACRO(FOO, function() {
    return 'parent level used';
  });
  return function() {
    return FOO();
  };
})();
const parent2 = (function() {
  DEFINE_MACRO(FOO, function() {
    return 'parent-parent level used';
  });
  return (function() {
    return function() {
      return FOO();
    };
  })();
})();

const child = (function() {
  return function() {
    function innerNotCalled() {
      DEFINE_MACRO(FOO, function() {
        return 'child level used';
      });
    }
    try {
      return FOO();
    } catch(e) {
      if(e.message === 'FOO is not defined') {
        return 'child level cannot used';
      } else {
        throw e;
      }
    }
  };
})();

const child1 = (function() {
  return function() {
    DEFINE_MACRO(innerNotCalled, function innerNotCalled() {
      DEFINE_MACRO(FOO, function() {
        return 'child level used';
      });
    });
    try {
      return FOO();
    } catch(e) {
      if(e.message === 'FOO is not defined') {
        return 'child level cannot used';
      } else {
        throw e;
      }
    }
  };
})();

export default function demo () {
  return [parent0(), parent1(), parent2(), child(), child1()];
}