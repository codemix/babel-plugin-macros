export default function demo () {
  DEFINE_MACRO(BEFORE,()=>"before");
  return [BEFORE(), AFTER()];
  DEFINE_MACRO(AFTER,()=>"after");
}