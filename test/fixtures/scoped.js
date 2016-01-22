function foo() {
  return SAME_NAME();
  DEFINE_MACRO(SAME_NAME, ()=>'foo');
}
function bar() {
  return SAME_NAME();
  DEFINE_MACRO(SAME_NAME, ()=>'bar');
}

export default function demo () {
  return [foo(), bar()];
}