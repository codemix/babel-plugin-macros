import * as t from 'babel-types';
import traverse from 'babel-traverse';
import {$registeredMacros} from './symbols';
import Macro from './Macro';
import {collectMacros} from './visitors';

export const DEFINE_MACRO = function defineMacro(path, scope) {
  "use strict";
  const {node} = path;
  const id = node.arguments[0];
  const name = id && id.name;
  const macroBody = node.arguments[1];
  const subScope = path.get('arguments')[1].scope;
  const location = node.loc ? `, at Line: ${node.loc.start.line} Column: ${node.loc.start.column}` : '';
  if (!(id && t.isIdentifier(id))) {
    throw new Error("First argument to DEFINE_MACRO must be an identifier" + location);
  }
  if (!t.isFunction(macroBody)) {
    throw new Error("Second argument to DEFINE_MACRO must be a FunctionExpression or ArrowFunctionExpression" + location);
  }

  scope[$registeredMacros] = scope[$registeredMacros] || {};
  scope[$registeredMacros][name] = new Macro({name: name, macroBody, scope: subScope});
  traverse(
    macroBody,
    traverse.visitors.merge([
      collectMacros,
      {
        ThisExpression() {
          throw new Error("Can not use `this` in macro" + location);
        },
        Identifier({node}) {
          if ("arguments" === node.name) {
            throw new Error("Can not use `arguments` in macro" + location);
          }
        }
      }
    ]),
    subScope
  );
  path.remove();
};
