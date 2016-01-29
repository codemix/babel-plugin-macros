export function cloneDeep(node /*: Object*/) /*: Object*/ {
  var newNode = Object.create(Object.getPrototypeOf(node)),
    keys = Object.keys(node)
      .concat(Object.getOwnPropertySymbols(node)),
    length = keys.length,
    key,
    i
    ;
  for(i = 0; i < length; i++) {
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