'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = build;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * # Babel Macros
 */
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
      enter: function enter(path) {
        if (path.isFunction()) {
          path.traverse({
            enter: function enter(child, parent) {
              if (path.isVariableDeclarator() || path.isFunctionDeclaration()) {
                references[child.id.name] = true;
              } else if (path.isIdentifier() && (!t.isFunction(parent) || parent.type === "ArrowFunctionExpression" && parent.body === child) && (!t.isMemberExpression(parent) || parent.object === child) && ~paramNames.indexOf(child.name)) {
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
      var cloned = _lodash2.default.cloneDeep(node);

      var _cloned$params$reduce = cloned.params.reduce(function (_ref3, id, index) {
        var _ref4 = _slicedToArray(_ref3, 2);

        var params = _ref4[0];
        var seen = _ref4[1];

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
        enter: function enter(subPath) {
          var child = subPath.node;
          var parent = subPath.parent;

          if (child.type === 'Identifier' && (parent.type !== "MemberExpression" || parent.object === child || parent.computed && parent.property === child)) {
            if (params[child.name]) {
              var param = params[child.name];
              if (param.replacement.type === 'Identifier' || param.replacement.type === 'Literal' || paramReferenceCounts[child.name] === 1 && param.replacement.type === 'MemberExpression') {
                subPath.replaceWith(param.replacement);
                seen[child.name] = param.replacement;
              } else {
                if (!seen[child.name]) {
                  seen[child.name] = path.scope.generateUidIdentifier(child.name);

                  getParentBlock(path).insertBefore([t.variableDeclaration('const', [t.variableDeclarator(seen[child.name], param.replacement)])]);
                }
                subPath.replaceWith(seen[child.name]);
              }
            } else if (references[child.name]) {
              if (!seen[child.name]) {
                seen[child.name] = path.scope.generateUidIdentifier(child.name);
              }
              subPath.replaceWith(seen[child.name]);
            }
          } else if (subPath.isReturnStatement()) {
            if (blockStack.length > 0) {
              hasEarlyReturn = true;
            }
            returnStatements.push([subPath, child]);
          } else if (subPath.isLoop()) {
            loopStack.push(subPath);
          } else if (subPath.isFunction()) {
            subPath.skip();
          } else if (subPath.isScope()) {
            blockStack.push(subPath);
          }
        },
        exit: function exit(path) {
          if (path.isLoop()) {
            loopStack.pop();
          } else if (path.isScope()) {
            blockStack.pop();
          }
        }
      }, path.scope);

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

  function getMacro(node) {
    if (node.type === 'CallExpression') {
      return getMacro(node.callee);
    } else if (t.isIdentifier(node)) {
      if (registered[node.name]) {
        return registered[node.name];
      } else if (builtin[node.name]) {
        return builtin[node.name];
      }
    } else if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
      return getMacro(node.property);
    }
  }

  var visitors = {
    CallExpression: {
      enter: function enter(path) {
        var node = path.node;
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
            runMacro(path, macro);
          }
        }
      },
      exit: function exit(path) {
        var node = path.node;
        if (node._needsVisit) {
          node._needsVisit = false;
          path.traverse(visitors);
        }
      }
    },
    Program: {
      exit: function exit(path) {
        var node = path.node;
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
  return { visitor: visitors };
}