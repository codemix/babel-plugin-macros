import {$processedByMacro} from './symbols';
import * as t from 'babel-types';
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

/* @todo
macros are deleted immediately after fin ding
This prevents third-party plug-ins to make a transformation within their code
Possible solutions:
1. Before removing the macro execute other plugins on his body
perhaps they are all available in the article
2. remove the macros only when they are all applied
3. temporary hack. search and process of macros only after all the work of other plug-ins

last variant temporary is used
*/
export const mainVisitor = {
  Program: {
    exit (path) {
      "use strict";
      path.traverse(collectMacros);
      path.traverse(processMacros);
    }
  }
};

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
