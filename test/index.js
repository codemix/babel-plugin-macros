import Plugin from '../src';
import fs from 'fs';
import {parse, transform, traverse, types as t} from 'babel-core';


function load (basename: string): string {
  const filename = `${__dirname}/fixtures/${basename}.js`;
  return fs.readFileSync(filename, 'utf8');
}

function runTest (basename: string, expectedResult: mixed, args: Array = []): void {
  try {
    const source = load(basename);
    const transformed = transform(source, {"presets": ["es2015"], plugins: [Plugin]});
     //console.log(transformed.code);
    const context = {
      exports: {}
    };
    const loaded = new Function('module', 'exports', transformed.code);
    loaded(context, context.exports);
    const result = typeof context.exports.default === 'function' ? context.exports.default(...args) : context.exports.default;
    if(expectedResult instanceof Error) {
        throw new Error('expected error, but got result ' + JSON.stringify(result));
    }
    result.should.eql(expectedResult);
  } catch(e) {
    if(expectedResult instanceof Error) {
      e.message.should.eql(expectedResult.message);
    }
    else {
      throw e;
    }
  }
}

function run (basename: string, expectedResult: mixed): void {
  it(`should compile macros in "${basename}"`, function () {
    runTest(basename, expectedResult);
  });
}

run.only = function (basename: string, expectedResult: mixed): void {
  it.only(`should compile macros in "${basename}"`, function () {
    try {
      runTest(basename, expectedResult);
    }
    catch (e) {
      if (e.name !== 'AssertionError') {
        console.error(e.stack);
      }
      throw e;
    }
  });
};

function extractPath (scope) {
  const parts = [];
  do {
    parts.unshift(scope.block.type);
  }
  while (scope = scope.parent);
  return parts.join(' ');
}

describe('Babel Macros', function () {
  run("id", 246);
  run("double", 492);
  run("triple", 738);
  run("map", [2, 3, 4, 5]);
  run("map-filter", [[2, 3, 4, 5], [4, 5]]);
  run("some", true);
  run("redefine", "baz");
  run("hoisting", ["bar", "baz"]);
  run("functions", ["ARROW", "ANONYMOUS", "NAMED"]);
  run("unique-local-names", ["foo1", undefined, "foo-main"]);
  run("not-passed-args", [123, undefined]);
  run("define-after-using", [["before", "after"], ["before", "after"]]);
  run("scoped", ["foo", "bar"]);
  run("different-levels", ["same level used", "parent level used", "parent-parent level used", "child level cannot used", "child level cannot used"]);
  run("macro-call-in-macro", ["foo", "bar"]);
  run("macro-defined-in-macro", ["foo", "bar"]);
  run("wrong-scoped", new Error('BAR is not defined'));
  run("redefine-submacro-in-call-scope", [["foo", "bar", "quux"], ["baz", "bat", "quux"]]);
  run("define-after-using-scoped", ["inner", "inner"]);
  run("infinite-recursion-call", new Error('unknown: Maximum call stack size exceeded'));
  run("self-recursion-call", new Error('unknown: Maximum call stack size exceeded'));
  run("recursive-call", ["foo", "bar"]);
});

