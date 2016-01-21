DEFINE_MACRO(FOO, (input1, input2) => {
  return [String(input1), String(input2)];
});

export default function demo() {
  return FOO(123).join('.');
}
