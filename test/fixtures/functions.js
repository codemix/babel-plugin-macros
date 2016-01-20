DEFINE_MACRO(ARROW, () => "ARROW");
DEFINE_MACRO(ANONYMOUS, function () {
  return "ANONYMOUS";
});
DEFINE_MACRO(NAMED, function NAMED() {
  return "NAMED";
});

export default function demo() {
  return [ARROW(), ANONYMOUS(), NAMED()].join('.');
}
