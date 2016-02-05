DEFINE_MACRO(FOO, function() {
  return ["foo"].concat(BAR());
});
DEFINE_MACRO(BAR, function() {
  empty: {

  }
  return ["bar"];
});

export default function demo () {
  return FOO();
}