DEFINE_MACRO(FOO, (input1, input2) => {
  return [input1, input2];
});

export default function demo() {
  return FOO(123);
}
