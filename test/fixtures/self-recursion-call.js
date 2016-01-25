DEFINE_MACRO(FOO, () => {
  return ['foo'].concat(FOO());
});

export default function demo() {
  return FOO();
}
