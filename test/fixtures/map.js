DEFINE_MACRO(MAP, (input, visitor) => {
  const length = input.length;
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = visitor(input[i], i, input);
  }
  return result;
});

export default function demo () {
  return MAP([1,2,3,4], item => item + 1);
}