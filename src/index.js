import {cloneDeep, getParentBlock, camelCase} from './utils';

const $registeredMacros = Symbol('registeredMacros');
const $macroState = Symbol('macroState');
const $processedByMacro = Symbol('processedByMacro');

/**
 * # Babel Macros
 */
export default function build (babel: Object): Object {
  "use strict";
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
    const id = node.arguments[0];
    const name = id && id.name;
    const macroBody = node.arguments[1];
    const subScope = path.get('arguments')[1].scope;
    const location = node.loc ? `, at Line: ${node.loc.start.line} Column: ${node.loc.start.column}`: '';
    if (!(id && t.isIdentifier(id))) {
      throw new Error("First argument to DEFINE_MACRO must be an identifier" + location);
    }
    if (!t.isFunction(macroBody)) {
      throw new Error("Second argument to DEFINE_MACRO must be a FunctionExpression or ArrowFunctionExpression" + location);
    }

    scope[$registeredMacros] = scope[$registeredMacros] || {};
    scope[$registeredMacros][name] = new Macro({name: name, macroBody, scope: subScope, state});
    traverse(
      macroBody,
      traverse.visitors.merge([
        visitors,
        {
          ThisExpression() {
            throw new Error("Can not use `this` in macro" + location);
          },
          Identifier({node}) {
            if("arguments" === node.name) {
              throw new Error("Can not use `arguments` in macro" + location);
            }
          }
        }
      ]),
      subScope,
      state
    );
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
    }
    return function (path, scope) {
      const cloned = cloneDeep(node);
      const uid = scope.generateUidIdentifier(camelCase(name));
      const labelUid = scope.generateUidIdentifier('_' + name.toUpperCase());

      const [params, seen] = cloned.params.reduce(([params, seen], id, index) => {
        params[id.name] = {
          id: id,
          replacement: path.node.arguments[index] || t.identifier('undefined'),
          reference: null
        };
        seen[id.name] = false;
        return [params, seen];
      }, [{}, {}]);

      const loopStack = [];
      let hasMultipleReturn = false;

      traverse(cloned, {
        ReturnStatement(path, state) {
          if(++state.count > 1) {
            hasMultipleReturn = true;
            path.stop();
          }
        }
      }, scope, {count:0});
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
            const isLast = child === cloned.body.body[cloned.body.body.length - 1];
            subPath.replaceWith(t.expressionStatement(t.assignmentExpression('=', uid, child.argument || t.identifier('undefined'))));
            if (hasMultipleReturn && !isLast) {
              subPath.insertAfter(t.breakStatement(labelUid));
            }
          }
          else if (subPath.isLoop()) {
            loopStack.push(subPath);
          }
          else if (subPath.isFunction()) {
            subPath.skip();
          }
        },
        exit (path) {
          if (path.isLoop()) {
            loopStack.pop();
          }
        }
      }, scope);


      if (t.isStatement(cloned.body)) {
        const parentBlock = getParentBlock(path);
        parentBlock.insertBefore([
          t.variableDeclaration('let', [
            t.variableDeclarator(uid)
          ])
        ]);

        if (hasMultipleReturn) {
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
    if(typeof macro === 'function') {
      macro(path, scope, state)
    } else {
      macro.run(path, scope, state)
    }
  }

  function getMacro (node: Object, scope: Object, state: Object): Macro | Function | void {
    if (node.type === 'CallExpression') {
      return getMacro(node.callee, scope, state);
    }
    else if (t.isIdentifier(node)) {
      if(state[$macroState].macrosDefined) {
        while(scope) {
          if (scope[$registeredMacros] && scope[$registeredMacros][node.name]) {
            return scope[$registeredMacros][node.name];
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
        if(state[$macroState].macrosDefined) {
          if (node[$processedByMacro]) {
            return;
          }
        }
        if (t.isMemberExpression(node.callee)) {
          if (
            !node.callee.computed &&
            getMacro(node.callee.object, path.scope, state) &&
            getMacro(node.callee.property, path.scope, state)
          ) {
            const head = node.callee.object;
            const tailId = node.callee.property;
            node.arguments.unshift(head);
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

        if(state[$macroState].macrosDefined) {
          node[$processedByMacro] = true;
        }
      }
    },
    Program: {
      enter (path, state) {
        state[$macroState] = {
          macrosDefined: false
        };
      },
      exit (path, state) {
        if (!state[$macroState].macrosDefined) {
          state[$macroState].macrosDefined = true;
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