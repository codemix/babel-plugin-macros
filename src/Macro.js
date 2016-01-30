import * as t from 'babel-types';
import traverse from 'babel-traverse';
import * as builtin from './builtin';
import {processMacros} from './visitors';
import {cloneDeep, getParentBlock, camelCase} from './utils';
import {$registeredMacros} from './symbols';

export default class Macro {
  constructor({name, macroBody, scope}) {
    this.name = name;
    this.macroBody = macroBody;
    this.scope = scope;
  }

  run(path, scope) {
    if (!this.macro) {
      this.macro = this.compileMacro(this.name, this.macroBody, this.scope);
    }
    return this.macro(path, scope);
  }
  
  compileMacro(name:string, node:Object, scope:Object):Function {
    const paramNames = node.params.map(param => param.name);
    const paramReferenceCounts = {};
    const references = Object.create(null);
    if (t.isFunction(node)) {
      traverse(node, processMacros, scope);
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
          if (++state.count > 1) {
            hasMultipleReturn = true;
            path.stop();
          }
        }
      }, scope, {count: 0});
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

  static runMacro(path, macro, scope) {
    if (typeof macro === 'function') {
      macro(path, scope)
    } else {
      macro.run(path, scope)
    }
  }

  static getMacro(node:Object, scope:Object, isBuiltinMacro:boolean):Macro | Function | void {
    if (node.type === 'CallExpression') {
      return Macro.getMacro(node.callee, scope, isBuiltinMacro);
    }
    else if (t.isIdentifier(node)) {
      if (isBuiltinMacro) {
        if (builtin[node.name]) {
          return builtin[node.name];
        }
        return;
      }
      while (scope) {
        if (scope[$registeredMacros] && scope[$registeredMacros][node.name]) {
          return scope[$registeredMacros][node.name];
        }
        scope = scope.parent;
      }
    }
    else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
      return Macro.getMacro(node.property, scope, isBuiltinMacro);
    }
  }
};
