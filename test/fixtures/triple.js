DEFINE_MACRO(TRIPLE, id => id + id + id);

const foo = 123;

function bar () {
  return 123;
}

export default function demo () {
  return TRIPLE(bar()) + TRIPLE(foo);
}