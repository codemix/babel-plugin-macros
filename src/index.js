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
      enter () {
        if (this.isFunction()) {
          this.traverse({
            enter (child, parent) {
              if (this.isVariableDeclarator() || this.isFunctionDeclaration()) {
                references[child.id.name] = true;
              }
              else if (this.isIdentifier() && (!t.isFunction(parent) || (parent.type === "ArrowFunctionExpression" && parent.body === child)) && (!t.isMemberExpression(parent) || parent.object === child) && ~paramNames.indexOf(child.name)) {
                paramReferenceCounts[child.name] = paramReferenceCounts[child.name] || 0;
                paramReferenceCounts[child.name]++;
              }
            }
          });
        }
        this.skip();
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
        enter (child, parent) {
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
                this.replaceWith(param.replacement);
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
                this.replaceWith(seen[child.name]);
              }
            }
            else if (references[child.name]) {
              if (!seen[child.name]) {
                seen[child.name] = path.scope.generateUidIdentifier(child.name);
              }
              this.replaceWith(seen[child.name])
            }
          }
          else if (this.isReturnStatement()) {
            if (blockStack.length > 0) {
              hasEarlyReturn = true;
            }
            returnStatements.push([this, child]);
          }
          else if (this.isLoop()) {
            loopStack.push(this);
          }
          else if (this.isFunction()) {
            this.skip();
          }
          else if (this.isScope()) {
            blockStack.push(this);
          }
        },
        exit () {
          if (this.isLoop()) {
            loopStack.pop();
          }
          else if (this.isScope()) {
            blockStack.pop();
          }
        }
      }, {scope: path.scope});


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
      enter (node, parent, scope) {
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
            runMacro(this, macro);
          }
        }
      },
      exit (node, parent, scope) {
        if (node._needsVisit) {
          node._needsVisit = false;
          this.traverse(visitors);
        }
      }
    },
    Program: {
      exit (node) {
        if (!this._macrosProcessed) {
          this._macrosProcessed = true;
          this.traverse(visitors);
        }
      }
    }
  };


  /**
   * Export the transformer.
   */
  return new Transformer("macros", visitors);

}