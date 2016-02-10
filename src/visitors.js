import {$processedByMacro} from './symbols';
import * as t from 'babel-types';
import traverse from 'babel-traverse';
import Macro from './Macro';
import {getLocationMessage, warning} from './utils';

export const collectMacros1 = {
  CallExpression(path) {
    "use strict";
    _processMacro(path, true);
  }
};

export const collectMacros2 = {
  LabeledStatement: {
    exit(path){
      "use strict";
      if (path.node.label.name === 'macro') {
        path.remove();
      }
    }
  },
  VariableDeclarator(path) {
    "use strict";
    const parent1 = path.parentPath.parentPath,
      parent2 = parent1.parentPath
      ;
    if (
      t.isLabeledStatement(parent1) && parent1.node.label.name === 'macro' ||
      t.isLabeledStatement(parent2) && parent2.node.label.name === 'macro'
    ) {
      Macro.register(path.node.id.name, path.get('init'), parent2.scope);
      path.remove();
    }
  },
  FunctionDeclaration(path) {
    "use strict";
    const node = path.node,
      parent1 = path.parentPath,
      parent2 = parent1.parentPath
      ;
    if (
      t.isLabeledStatement(parent1) && parent1.node.label.name === 'macro' ||
      t.isLabeledStatement(parent2) && parent2.node.label.name === 'macro'
    ) {
      warning(`FunctionDeclaration converted to macro. Incompatible with native JS behaviour${getLocationMessage(node)}`);
      Macro.register(node.id.name, path, parent2.scope);
      path.remove();
    }
  }
};

export const collectMacros = traverse.visitors.merge([
  collectMacros1,
  collectMacros2
]);

export const processMacros = {
  CallExpression(path, state) {
    "use strict";
    const {node} = path;
    if (node[$processedByMacro]) {
      return;
    }
    _processMacro(path, state || false);
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
    enter (path) {
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
