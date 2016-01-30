import {$macroState, $processedByMacro} from './symbols';
import * as t from 'babel-types';
import Macro from './Macro';

export const visitor = {
  CallExpression: {
    enter (path, state) {
      "use strict";
      const {node} = path;
      if (state[$macroState].macrosDefined) {
        if (node[$processedByMacro]) {
          return;
        }
      }
      if (t.isMemberExpression(node.callee)) {
        if (
          !node.callee.computed &&
          Macro.getMacro(node.callee.object, path.scope, state) &&
          Macro.getMacro(node.callee.property, path.scope, state)
        ) {
          const head = node.callee.object;
          const tailId = node.callee.property;
          node.arguments.unshift(head);
          const macro = Macro.getMacro(tailId, path.scope, state);
          if (macro) {
            Macro.runMacro(path, macro, path.scope, state);
          }
        }
      }
      else {
        const macro = Macro.getMacro(node.callee, path.scope, state);
        if (macro) {
          Macro.runMacro(path, macro, path.scope, state);
        }
      }

      if (state[$macroState].macrosDefined) {
        node[$processedByMacro] = true;
      }
    }
  },
  Program: {
    enter (path, state) {
      "use strict";
      state[$macroState] = {
        macrosDefined: false
      };
    },
    exit (path, state) {
      "use strict";
      if (!state[$macroState].macrosDefined) {
        state[$macroState].macrosDefined = true;
        path.traverse(visitor, state);
      }
    }
  }
};
