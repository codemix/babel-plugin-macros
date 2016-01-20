import _ from 'lodash';

/**
 * # Babel Macros
 */
export default function build (babel: Object): Object {
  const {Transformer, types: t, traverse} = babel;

  /**
   * A list of registered macros.
   */
  const registered = Object.create(null);

  /**
   * A list of builtin macros.
   */
  const builtin = Object.create(null);

  builtin.DEFINE_MACRO = function defineMacro (path) {
    const {node} = path;
    const id = node.arguments[0];
    registered[id.name] = compileMacro(id.name, node.arguments[1], path);
    path.remove();
  };

  function compileMacro (name: string, node: Object, macroPath: Object): Function {
    const paramNames = node.params.map(param => param.name);
    const paramReferenceCounts = {};
    const references = Object.create(null);
    macroPath.traverse({
      enter (path) {
        if (path.isFunction()) {
          path.traverse({
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
          });
        }
        path.skip();
      }
    });
    return function (path) {
      const cloned = _.cloneDeep(node);
      const [params, seen] = cloned.params.reduce(([params, seen], id, index) => {
        params[id.name] = {
          id: id,
          replacement: path.node.arguments[index],
          reference: null
        };
        seen[id.name] = false;
        return [params, seen];
      }, [{}, {}]);

      const blockStack = [];
      const loopStack = [];
      const returnStatements = [];
      let hasEarlyReturn = false;

      traverse(cloned, {
        enter (subPath) {
          const {node: child, parent} = subPath;
          if (
            child.type === 'Identifier' &&
            (parent.type !== "MemberExpression" || parent.object === child || (parent.computed && parent.property === child))
          ) {
            if (params[child.name]) {
              const param = params[child.name];
              if (
                param.replacement.type === 'Identifier' ||
                param.replacement.type === 'Literal' ||
                (paramReferenceCounts[child.name] === 1 && param.replacement.type === 'MemberExpression')
              ) {
                subPath.replaceWith(param.replacement);
                seen[child.name] = param.replacement;
              }
              else {
                if (!seen[child.name]) {
                  seen[child.name] = path.scope.generateUidIdentifier(child.name);

                  getParentBlock(path).insertBefore([
                    t.variableDeclaration('const', [
                      t.variableDeclarator(seen[child.name], param.replacement)
                    ])
                  ]);
                }
                subPath.replaceWith(seen[child.name]);
              }
            }
            else if (references[child.name]) {
              if (!seen[child.name]) {
                seen[child.name] = path.scope.generateUidIdentifier(child.name);
              }
              subPath.replaceWith(seen[child.name])
            }
          }
          else if (subPath.isReturnStatement()) {
            if (blockStack.length > 0) {
              hasEarlyReturn = true;
            }
            returnStatements.push([subPath, child]);
          }
          else if (subPath.isLoop()) {
            loopStack.push(subPath);
          }
          else if (subPath.isFunction()) {
            subPath.skip();
          }
          else if (subPath.isScope()) {
            blockStack.push(subPath);
          }
        },
        exit (path) {
          if (path.isLoop()) {
            loopStack.pop();
          }
          else if (path.isScope()) {
            blockStack.pop();
          }
        }
      }, path.scope);


      if (t.isStatement(cloned.body)) {
        const uid = path.scope.generateUidIdentifier(camelCase(name));
        const labelUid = path.scope.generateUidIdentifier('_' + name.toUpperCase());
        const parentBlock = getParentBlock(path);
        parentBlock.insertBefore([
          t.variableDeclaration('let', [
            t.variableDeclarator(uid)
          ])
        ]);
        returnStatements.forEach(([path, child]) => {
          const isLast = child === cloned.body.body[cloned.body.body.length - 1];
          path.replaceWith(t.expressionStatement(t.assignmentExpression('=', uid, child.argument)));

          if (hasEarlyReturn && !isLast) {
            path.insertAfter(t.breakStatement(labelUid));
          }
        });

        if (hasEarlyReturn) {
          parentBlock.insertBefore(t.labeledStatement(labelUid, cloned.body));
        }
        else {
          parentBlock.insertBefore(cloned.body.body);
        }
        path.replaceWith(uid);
      }
      else {
        path.replaceWith(cloned.body);
      }
    };
  }

  function runMacro (path, macro) {
    macro(path);
  }


  function getParentBlock (path) {
    while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
      path = path.parentPath;
    }
    return path;
  }

  function getParentScope (path) {
    while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
      path = path.parentPath;
    }
    return path.scope;
  }

  function camelCase (input) {
    return input.toLowerCase().replace(/_(.)/g, (match, char) => char.toUpperCase());
  }

  function getMacro (node: Object): boolean {
    if (node.type === 'CallExpression') {
      return getMacro(node.callee);
    }
    else if (t.isIdentifier(node)) {
      if (registered[node.name]) {
        return registered[node.name];
      }
      else if (builtin[node.name]) {
       return builtin[node.name];
      }
    }
    else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
      return getMacro(node.property);
    }
  }


  const visitors = {
    CallExpression: {
      enter (path) {
        const node = path.node;
        if (t.isMemberExpression(node.callee)) {
          if (
            !node.callee.computed &&
            getMacro(node.callee.object) &&
            getMacro(node.callee.property)
          ) {
            node._needsVisit = true;
            const head = node.callee.object;
            const tailId = node.callee.property;
            node.callee = tailId;
            node.arguments.unshift(head);
          }
        }
        else {
          const macro = getMacro(node.callee);
          if (macro) {
            runMacro(path, macro);
          }
        }
      },
      exit (path) {
        const node = path.node;
        if (node._needsVisit) {
          node._needsVisit = false;
          path.traverse(visitors);
        }
      }
    },
    Program: {
      exit (path) {
        const node = path.node;
        if (!node._macrosProcessed) {
          node._macrosProcessed = true;
          path.traverse(visitors);
        }
      }
    }
  };


  /**
   * Export the transformer.
   */
  return {visitor: visitors};

}