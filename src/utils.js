import traverse from 'babel-traverse';
import * as t from 'babel-types';

export function getParentBlock(path) {
  "use strict";
  while (path.parentPath.type !== 'Program' && path.parentPath && !(path.parentPath.isLabeledStatement() || path.parentPath.isBlockStatement())) {
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

export function warning(msg) {
  "use strict";
  console.error(msg);
};

export function getLocationMessage(node) {
  "use strict";
  return node.loc ? `, at Line: ${node.loc.start.line} Column: ${node.loc.start.column + 1}` : '';
};