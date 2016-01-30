import {$processedByMacro} from './symbols';
import * as t from 'babel-types';
import traverse from 'babel-traverse';
import Macro from './Macro';

export const collectMacros = {
  CallExpression(path) {
    "use strict";
    _processMacro(path, true);
  }
};

export const processMacros = {
  CallExpression(path) {
    "use strict";
    const {node} = path;
    if (node[$processedByMacro]) {
      return;
    }
    _processMacro(path, false);
    node[$processedByMacro] = true;
  }
};

export const mainVisitor = traverse.visitors.merge([
  collectMacros,
  {
    Program: {
      exit (path) {
        "use strict";
        path.traverse(processMacros);
      }
    }
  }
]);

function _processMacro(path, isBuiltinMacro) {
  "use strict";
  const {node} = path;
  if (t.isMemberExpression(node.callee)) {
    if (
      !node.callee.computed &&
      Macro.getMacro(node.callee.object, path.scope, isBuiltinMacro) &&
      Macro.getMacro(node.callee.property, path.scope, isBuiltinMacro)
    ) {
      const head = node.callee.object;
      const tailId = node.callee.property;
      node.arguments.unshift(head);
      const macro = Macro.getMacro(tailId, path.scope, isBuiltinMacro);
      if (macro) {
        Macro.runMacro(path, macro, path.scope);
      }
    }
  }
  else {
    const macro = Macro.getMacro(node.callee, path.scope, isBuiltinMacro);
    if (macro) {
      Macro.runMacro(path, macro, path.scope);
    }
  }
}
