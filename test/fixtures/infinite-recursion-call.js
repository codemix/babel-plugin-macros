DEFINE_MACRO(FOO, () => {
  return ['foo'].concat(BAR());
});
DEFINE_MACRO(BAR, () => {
  return ['bar'].concat(FOO());
});

export default function demo() {
  return FOO();
}
