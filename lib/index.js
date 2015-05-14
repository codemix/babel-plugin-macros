'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

/**
 * # Babel Macros
 */
exports['default'] = build;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function build(babel) {
  var Transformer = babel.Transformer;
  var t = babel.types;
  var traverse = babel.traverse;

  /**
   * A list of registered macros.
   */
  var registered = Object.create(null);

  /**
   * A list of builtin macros.
   */
  var builtin = Object.create(null);

  builtin.DEFINE_MACRO = function defineMacro(path) {
    var node = path.node;

    var id = node.arguments[0];
    registered[id.name] = compileMacro(id.name, node.arguments[1], path);
    path.remove();
  };

  function compileMacro(name, node, macroPath) {
    var paramNames = node.params.map(function (param) {
      return param.name;
    });
    var paramReferenceCounts = {};
    var references = Object.create(null);
    macroPath.traverse({
      enter: function enter() {
        if (this.isFunction()) {
          this.traverse({
            enter: function enter(child, parent) {
              if (this.isVariableDeclarator() || this.isFunctionDeclaration()) {
                references[child.id.name] = true;
              } else if (this.isIdentifier() && (!t.isFunction(parent) || parent.type === 'ArrowFunctionExpression' && parent.body === child) && (!t.isMemberExpression(parent) || parent.object === child) && ~paramNames.indexOf(child.name)) {
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
      var cloned = _lodash2['default'].cloneDeep(node);

      var _cloned$params$reduce = cloned.params.reduce(function (_ref3, id, index) {
        var _ref32 = _slicedToArray(_ref3, 2);

        var params = _ref32[0];
        var seen = _ref32[1];

        params[id.name] = {
          id: id,
          replacement: path.node.arguments[index],
          reference: null
        };
        seen[id.name] = false;
        return [params, seen];
      }, [{}, {}]);

      var _cloned$params$reduce2 = _slicedToArray(_cloned$params$reduce, 2);

      var params = _cloned$params$reduce2[0];
      var seen = _cloned$params$reduce2[1];

      var blockStack = [];
      var loopStack = [];
      var returnStatements = [];
      var hasEarlyReturn = false;

      traverse(cloned, {
        enter: function enter(child, parent) {
          if (child.type === 'Identifier' && (parent.type !== 'MemberExpression' || parent.object === child || parent.computed && parent.property === child)) {
            if (params[child.name]) {
              var param = params[child.name];
              if (param.replacement.type === 'Identifier' || param.replacement.type === 'Literal' || paramReferenceCounts[child.name] === 1 && param.replacement.type === 'MemberExpression') {
                this.replaceWith(param.replacement);
                seen[child.name] = param.replacement;
              } else {
                if (!seen[child.name]) {
                  seen[child.name] = path.scope.generateUidIdentifier(child.name);

                  getParentBlock(path).insertBefore([t.variableDeclaration('const', [t.variableDeclarator(seen[child.name], param.replacement)])]);
                }
                this.replaceWith(seen[child.name]);
              }
            } else if (references[child.name]) {
              if (!seen[child.name]) {
                seen[child.name] = path.scope.generateUidIdentifier(child.name);
              }
              this.replaceWith(seen[child.name]);
            }
          } else if (this.isReturnStatement()) {
            if (blockStack.length > 0) {
              hasEarlyReturn = true;
            }
            returnStatements.push([this, child]);
          } else if (this.isLoop()) {
            loopStack.push(this);
          } else if (this.isFunction()) {
            this.skip();
          } else if (this.isScope()) {
            blockStack.push(this);
          }
        },
        exit: function exit() {
          if (this.isLoop()) {
            loopStack.pop();
          } else if (this.isScope()) {
            blockStack.pop();
          }
        }
      }, { scope: path.scope });

      if (t.isStatement(cloned.body)) {
        (function () {
          var uid = path.scope.generateUidIdentifier(camelCase(name));
          var labelUid = path.scope.generateUidIdentifier('_' + name.toUpperCase());
          var parentBlock = getParentBlock(path);
          parentBlock.insertBefore([t.variableDeclaration('let', [t.variableDeclarator(uid)])]);
          returnStatements.forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var path = _ref2[0];
            var child = _ref2[1];

            var isLast = child === cloned.body.body[cloned.body.body.length - 1];
            path.replaceWith(t.expressionStatement(t.assignmentExpression('=', uid, child.argument)));

            if (hasEarlyReturn && !isLast) {
              path.insertAfter(t.breakStatement(labelUid));
            }
          });

          if (hasEarlyReturn) {
            parentBlock.insertBefore(t.labeledStatement(labelUid, cloned.body));
          } else {
            parentBlock.insertBefore(cloned.body.body);
          }
          path.replaceWith(uid);
        })();
      } else {
        path.replaceWith(cloned.body);
      }
    };
  }

  function runMacro(path, macro) {
    macro(path);
  }

  function getParentBlock(path) {
    while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
      path = path.parentPath;
    }
    return path;
  }

  function getParentScope(path) {
    while (path.parentPath.type !== 'Program' && path.parentPath && !path.parentPath.isStatementOrBlock()) {
      path = path.parentPath;
    }
    return path.scope;
  }

  function camelCase(input) {
    return input.toLowerCase().replace(/_(.)/g, function (match, char) {
      return char.toUpperCase();
    });
  }

  function getMacro(_x) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var node = _x;

      if (node.type === 'CallExpression') {
        _x = node.callee;
        _again = true;
        continue _function;
      } else if (t.isIdentifier(node)) {
        if (registered[node.name]) {
          return registered[node.name];
        } else if (builtin[node.name]) {
          return builtin[node.name];
        }
      } else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
        _x = node.property;
        _again = true;
        continue _function;
      }
    }
  }

  var visitors = {
    CallExpression: {
      enter: function enter(node, parent, scope) {
        if (t.isMemberExpression(node.callee)) {
          if (!node.callee.computed && getMacro(node.callee.object) && getMacro(node.callee.property)) {
            node._needsVisit = true;
            var head = node.callee.object;
            var tailId = node.callee.property;
            node.callee = tailId;
            node.arguments.unshift(head);
          }
        } else {
          var macro = getMacro(node.callee);
          if (macro) {
            runMacro(this, macro);
          }
        }
      },
      exit: function exit(node, parent, scope) {
        if (node._needsVisit) {
          node._needsVisit = false;
          this.traverse(visitors);
        }
      }
    },
    Program: {
      exit: function exit(node) {
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
  return new Transformer('macros', visitors);
}

module.exports = exports['default'];