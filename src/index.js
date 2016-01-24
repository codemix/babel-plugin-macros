import _ from 'lodash';

/**
 * # Babel Macros
 */
export default function build (babel: Object): Object {
  const {types: t, traverse} = babel;

  /**
   * A list of builtin macros.
   */
  const builtin = Object.create(null);
  class Macro {
    constructor({name, macroBody, scope, state}) {
      this.name = name;
      this.macroBody = macroBody;
      this.scope = scope;
      this.state = state;
    }
    run(path, scope, state) {
      if(!this.macro) {
        this.macro = compileMacro(this.name, this.macroBody, this.scope, this.state);
      }
      return this.macro(path, scope, state);
    }
  }

  builtin.DEFINE_MACRO = function defineMacro (path, scope, state) {
    const {node} = path;
    const name = node.arguments[0].name;
    const macroBody = node.arguments[1];
    //TODO throw new Error('first argument for DEFINE_MACRO - is Identifier');//TODO test
    var subScope;
    traverse(node, {
      enter(path) {
        if(path.node === macroBody) {
          subScope = path.scope;
          path.skip();
        }
      }
    }, scope);
    scope._registeredMacros = scope._registeredMacros || {};
    scope._registeredMacros[name] = new Macro({name: name, macroBody, scope:subScope, state});
    traverse(macroBody, visitors, subScope, state);
    path.remove();
  };

  function compileMacro (name: string, node: Object, scope: Object, state: Object): Function {
    const paramNames = node.params.map(param => param.name);
    const paramReferenceCounts = {};
    const references = Object.create(null);
    if (t.isFunction(node)) {
      traverse(node, visitors, scope, state);
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
    } else {
      throw new Error('second argument for DEFINE_MACRO - is FunctionExpression or ArrowFunctionExpression');//TODO test
    }
    return function (path, scope, state) {
      const cloned = _.cloneDeep(node);
      const [params, seen] = cloned.params.reduce(([params, seen], id, index) => {
        params[id.name] = {
          id: id,
          replacement: path.node.arguments[index] || t.identifier('undefined'),
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
                  seen[child.name] = scope.generateUidIdentifier(child.name);

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
                seen[child.name] = scope.generateUidIdentifier(child.name);
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
      }, scope);


      if (t.isStatement(cloned.body)) {
        const uid = scope.generateUidIdentifier(camelCase(name));
        const labelUid = scope.generateUidIdentifier('_' + name.toUpperCase());
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

  function runMacro (path, macro, scope, state) {
    if('function' === typeof macro) {
      macro(path, scope, state)
    } else {
      macro.run(path, scope, state)
    }
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

  function getMacro (node: Object, scope: Object, state: Object): boolean {
    if (node.type === 'CallExpression') {
      return getMacro(node.callee, scope, state);
    }
    else if (t.isIdentifier(node)) {
      if(state._codemixMacros.macrosDefined) {
        while(scope) {
          if (scope._registeredMacros && scope._registeredMacros[node.name]) {
            return scope._registeredMacros[node.name];
          }
          scope = scope.parent;
        }
      }
      if (builtin[node.name]) {
       return builtin[node.name];
      }
    }
    else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
      return getMacro(node.property, scope, state);
    }
  }


  const visitors = {
    CallExpression: {
      enter (path, state) {
        const node = path.node;
        if(state._codemixMacros.macrosDefined) {
          if (node._processedByMacro) {
            return;
          }
          node._processedByMacro = true;
        }
        if (t.isMemberExpression(node.callee)) {
          // TODO temp locked for refactoring. need another idea for chaining more than 2 macros
          if (
            !node.callee.computed &&
            getMacro(node.callee.object, path.scope, state) &&
            getMacro(node.callee.property, path.scope, state)
          ) {
            const head = node.callee.object;
            const tailId = node.callee.property;
            node.arguments.unshift(head);//TODO - so slow. meybe is ecponent slow ?
            const macro = getMacro(tailId, path.scope, state);
            if (macro) {
              runMacro(path, macro, path.scope, state);
            }
          }
        }
        else {
          const macro = getMacro(node.callee, path.scope, state);
          if (macro) {
            runMacro(path, macro, path.scope, state);
          }
        }
      }
    },
    Program: {
      enter (path, state) {
        state._codemixMacros = {
          macrosDefined: false
        };
      },
      exit (path, state) {
        if (!state._codemixMacros.macrosDefined) {
          state._codemixMacros.macrosDefined = true;
          path.traverse(visitors, state);
        }
      }
    }
  };


  /**
   * Export the transformer.
   */
  return {visitor: visitors};

}