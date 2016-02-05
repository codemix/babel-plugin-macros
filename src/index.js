import {mainVisitor} from './visitors';

/**
 * # Babel Macros
 */
export default function build():Object {
  "use strict";
  return {visitor: mainVisitor};
};
