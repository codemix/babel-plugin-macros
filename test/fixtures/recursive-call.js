DEFINE_MACRO(FOO, () => {
  return ['foo'].concat(BAR());
});
DEFINE_MACRO(BAR, () => {
  return ['bar'];
});

export default function demo() {
  return FOO();
}
