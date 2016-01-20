DEFINE_MACRO(FOO, () => "bar");
DEFINE_MACRO(FOO, () => "baz");

export default function demo() {
  return FOO();
}
