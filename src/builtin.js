import * as t from 'babel-types';
import Macro from './Macro';
export const DEFINE_MACRO = function defineMacro(path, scope) {
  "use strict";
  const {node} = path;
  const location = node.loc ? `, at Line: ${node.loc.start.line} Column: ${node.loc.start.column}` : '';
  if (!t.isIdentifier(node.arguments[0])) {
    throw new Error("First argument to DEFINE_MACRO must be an identifier" + location);
  }
  if (!t.isFunction(node.arguments[1])) {
    throw new Error("Second argument to DEFINE_MACRO must be a FunctionExpression or ArrowFunctionExpression" + location);
  }
  Macro.register(node.arguments[0].name, path.get('arguments.1'), scope, location);
  path.remove();
};
