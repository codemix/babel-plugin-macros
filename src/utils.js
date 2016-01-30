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
