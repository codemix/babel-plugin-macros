import * as t from 'babel-types';
import traverse from 'babel-traverse';
import * as builtin from './builtin';
import {collectMacros, processMacros} from './visitors';
import {getParentBlock, camelCase, checkMultipleReturn, collectReferences} from './utils';
import {$registeredMacros} from './symbols';

export default class Macro {
  constructor({name, macroBody, scope, location}) {
    location = location || '';
    traverse(
      macroBody,
      traverse.visitors.merge([
        collectMacros,
        {
          ThisExpression() {
            throw new Error("Can not use `this` in macro" + location);
          },
          Identifier({node}) {
            if ("arguments" === node.name) {
              throw new Error("Can not use `arguments` in macro" + location);
            }
          }
        }
      ]),
      scope
    );
    this.name = name;
    this.macroBody = macroBody;
    this.scope = scope;
  }

  static register(name, macroPath, scope, location) {
    const macroBody = macroPath.node,
      subScope = macroPath.scope;
    location = location || '';
    scope[$registeredMacros] = scope[$registeredMacros] || {};
    scope[$registeredMacros][name] = new Macro({name, macroBody, scope: subScope, location});
  }

  run(path, scope) {
    if (!this.macro) {
      this.macro = Macro.compileMacro(this.name, this.macroBody, this.scope);
    }
    return this.macro(path, scope);
  }

  static compileMacro(name:string, node:Object, scope:Object):Function {
    traverse(node, processMacros, scope);
    const {references, paramReferenceCounts} = collectReferences(node, scope);
    return function (path, scope) {
      const cloned = t.cloneDeep(node);
      const uid = scope.generateUidIdentifier(camelCase(name));
      const labelUid = scope.generateUidIdentifier('_' + name.toUpperCase());
      var argsMacros = {};
      const [params, seen] = cloned.params.reduce(([params, seen], id, index) => {
        const argument = path.get('arguments.' + index);
        if (argument && argument.isFunction()) {
          argsMacros[id.name] = new Macro({name: id.name, macroBody: argument.node, scope: argument.scope});
        } else {
          params[id.name] = {
            id: id,
            replacement: path.node.arguments[index] || t.identifier('undefined'),
            reference: null
          };
          seen[id.name] = false;
        }
        return [params, seen];
      }, [{}, {}]);
      traverse(cloned, processMacros, scope, argsMacros, path.parentPath);

      let hasMultipleReturn = checkMultipleReturn(cloned, scope);
      traverse(cloned, {
        Identifier(subPath) {
          const {node: child, parent} = subPath;
          if (parent.type !== "MemberExpression" || parent.object === child || parent.computed && parent.property === child) {
            if (params[child.name]) {
              const param = params[child.name];
              if (
                param.replacement.type === 'Identifier' ||
                param.replacement.type === 'Literal' ||
                paramReferenceCounts[child.name] === 1 && param.replacement.type === 'MemberExpression'
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
        },
        ReturnStatement(subPath) {
          const {node: child} = subPath;
          const isLast = child === cloned.body.body[cloned.body.body.length - 1];
          subPath.replaceWith(t.expressionStatement(t.assignmentExpression('=', uid, child.argument || t.identifier('undefined'))));
          if (hasMultipleReturn && !isLast) {
            subPath.insertAfter(t.breakStatement(labelUid));
          }
        },
        FunctionDeclaration() {
          // @todo need correct rename. now renames only usages, but not function
          throw new Error('FunctionDeclaration in macros are not supported temporarily');
        },
        Function(subPath) {
          subPath.skip();
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

  static getMacro(node:Object, scope:Object, isBuiltinMacro:boolean | Object):Macro | Function | void {
    if (node.type === 'CallExpression') {
      return Macro.getMacro(node.callee, scope, isBuiltinMacro);
    }
    else if (t.isIdentifier(node)) {
      if (isBuiltinMacro) {
        if ('object' === typeof isBuiltinMacro) {
          if (isBuiltinMacro[node.name]) {
            return isBuiltinMacro[node.name];
          }
        }
        else if (builtin[node.name]) {
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
