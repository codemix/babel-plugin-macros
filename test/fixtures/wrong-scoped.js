DEFINE_MACRO(FOO, () => BAR());
export default function demo() {
  DEFINE_MACRO(BAR, ()=> "called")
  return FOO();
}