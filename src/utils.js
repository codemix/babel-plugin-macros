import traverse from 'babel-traverse';
import * as t from 'babel-types';

export function cloneDeep(node /*: Object*/) /*: Object*/ {
  "use strict";
  var newNode = Object.create(Object.getPrototypeOf(node)),
    keys = Object.keys(node)
      .concat(Object.getOwnPropertySymbols(node)),
    length = keys.length,
    key,
    i
    ;
  for (i = 0; i < length; i++) {
    key = keys[i];
    if (key[0] === "_") {
      continue;
    }
    var val = node[key];
    if (val) {
      if (val.type) {
        val = cloneDeep(val);
      } else if (Array.isArray(val)) {
        val = val.map(cloneDeep);
      }
    }
    newNode[key] = val;
  }
  return newNode;
};

export function getParentBlock(path) {
  "use strict";
  while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
    path = path.parentPath;
  }
  return path;
};

export function getParentScope(path) {
  "use strict";
  while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
    path = path.parentPath;
  }
  return path.scope;
};

export function camelCase(input) {
  "use strict";
  return input.toLowerCase().replace(/_(.)/g, (match, char) => char.toUpperCase());
};

export function checkMultipleReturn(node, scope) {
  "use strict";
  let hasMultipleReturn = false;
  traverse(node, {
    ReturnStatement(path, state) {
      if (++state.count > 1) {
        hasMultipleReturn = true;
        path.stop();
      }
    }
  }, scope, {count: 0});
  return hasMultipleReturn;
};

export function collectReferences(node, scope) {
  "use strict";
  const paramNames = node.params.map(param => param.name);
  const paramReferenceCounts = {};
  const references = Object.create(null);
  traverse(node, {
    enter (subPath) {
      const {node: child, parent} = subPath;
      if (subPath.isVariableDeclarator() || subPath.isFunctionDeclaration()) {
        references[child.id.name] = true;
      }
      else if (subPath.isIdentifier() && (!t.isFunction(parent) || (parent.type === "ArrowFunctionExpression" && parent.body === child)) && (!t.isMemberExpression(parent) || parent.object === child) && ~paramNames.indexOf(child.name)) {
        paramReferenceCounts[child.name] = paramReferenceCounts[child.name] || 0;
        paramReferenceCounts[child.name]++;
      }
    }
  }, scope);
  return {paramReferenceCounts: paramReferenceCounts, references: references};
};
