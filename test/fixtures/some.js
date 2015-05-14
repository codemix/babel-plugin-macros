DEFINE_MACRO(SOME, (input, visitor) => {
  const length = input.length;
  for (let i = 0; i < length; i++) {
    if (visitor(input[i], i, input)) {
      return true;
    }
  }
  return false;
});

export default function demo () {
  return SOME([1, 2, 3], item => item > 2);
}