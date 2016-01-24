DEFINE_MACRO(MAP, (input, visitor) => {
  const length = input.length;
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = visitor(input[i], i, input);
  }
  return result;
});

DEFINE_MACRO(FILTER, (input, visitor) => {
  const filtered = [];
  for (let i = 0; i < input.length; i++) {
    if (visitor(input[i], i, input)) {
      filtered.push(input[i]);
    }
  }
  return filtered;
});

export default function demo () {
  return [
    MAP([1, 2, 3, 4, 5], item => item + 1).FILTER(a => a <= 5),
    MAP([1, 2, 3, 4, 5], item => item + 1).FILTER(a => a <= 5).FILTER(a => a > 3)
  ];
}