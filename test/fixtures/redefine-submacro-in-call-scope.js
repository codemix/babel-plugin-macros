function f1() {
  DEFINE_MACRO(FOO, (fn) => {
    DEFINE_MACRO(BAR, () => "bar");
    return ["foo", BAR(), fn()];
  });
  DEFINE_MACRO(BAR, () => "quux");
  return FOO(()=>BAR());
}
function f2() {
  return BAZ(()=>BAT());
  DEFINE_MACRO(BAZ, (fn) => {
    return ["baz", BAT(), fn()];
    DEFINE_MACRO(BAT, () => "bat");
  });
  DEFINE_MACRO(BAT, () => "quux");
}


export default function demo() {
  return [f1(), f2()];
}
