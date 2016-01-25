DEFINE_MACRO(FOO, () => {
  DEFINE_MACRO(BAR, () => {
    DEFINE_MACRO(BAZ, () => "baz");
    return ["bar"].concat(BAZ());
  });
  return ["foo"].concat(BAR());
});

export default function demo() {
  return FOO();
}
