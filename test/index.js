import Plugin from '../src';
import fs from 'fs';
import {parse, transform, traverse, types as t} from 'babel-core';


function load (basename: string): string {
  const filename = `${__dirname}/fixtures/${basename}.js`;
  return fs.readFileSync(filename, 'utf8');
}

function runTest (basename: string, expectedResult: mixed, args: Array = []): void {
  const source = load(basename);
  const transformed = transform(source, {"presets": ["es2015"], plugins: [Plugin]});
  // console.log(transformed.code);
  const context = {
    exports: {}
  };
  const loaded = new Function('module', 'exports', transformed.code);
  loaded(context, context.exports);
  const result = typeof context.exports.default === 'function' ? context.exports.default(...args) : context.exports.default;
  result.should.eql(expectedResult);
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
  run("map-filter", [2, 3, 4, 5]);
  run("some", true);
  run("redefine", "baz");
  run("hoisting", "barbaz");
  run("functions", "ARROW.ANONYMOUS.NAMED");
});

