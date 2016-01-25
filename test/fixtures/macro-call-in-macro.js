DEFINE_MACRO(FOO, () => ["foo"].concat(BAR()));
DEFINE_MACRO(BAR, () => ["bar"].concat(BAZ()));
DEFINE_MACRO(BAZ, () => ["baz"]);
export default function demo() {
  return FOO();
}