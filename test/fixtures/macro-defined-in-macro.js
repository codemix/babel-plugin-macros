DEFINE_MACRO(FOO, () => {
  DEFINE_MACRO(BAR, () => "bar");
  return ["foo", BAR()];
});

export default function demo() {
  return FOO();
}
