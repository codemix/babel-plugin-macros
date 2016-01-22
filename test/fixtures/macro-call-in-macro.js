DEFINE_MACRO(FOO, () => (
  ["foo", BAR()]
));
DEFINE_MACRO(BAR, () => "bar");
export default function demo() {
  return FOO();
}