//DEFINE_MACRO(ID, (id) => id);

function functionDeclaration() {
  var steps = [];
  function FOO_func() {
    steps.push(2);
  }
  var tmp = [steps.push(1), FOO_func()];
  return steps;
}
function functionMacroExpression() {
  var steps = [];
  DEFINE_MACRO(FOO, () => steps.push(2));
  var tmp = [steps.push(1), FOO()];
  return steps;
}
function functionMacroFunctionBody() {
  var steps = [];
  DEFINE_MACRO(FOO, () => {steps.push(2);});
  var tmp = [steps.push(1), FOO()];
  return steps;
}

export default function demo () {
  return [functionDeclaration(), functionMacroExpression(), functionMacroFunctionBody()];
}