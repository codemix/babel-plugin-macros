function f1() {
  DEFINE_MACRO(BEFORE,()=>"before");
  return [BEFORE(), AFTER()];
  DEFINE_MACRO(AFTER,()=>"after");
}
function f2() {
  DEFINE_MACRO(BEFORE,()=>"before");
  DEFINE_MACRO(AFTER,()=>"wrong-after");
  return [BEFORE(), AFTER()];
  DEFINE_MACRO(AFTER,()=>"after");
}

export default function demo () {
  return [f1() , f2()];
}