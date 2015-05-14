DEFINE_MACRO(ID, (id) => id);

const foo = 123;

function bar () {
  return 123;
}

export default function demo () {
  return ID(foo) + ID(bar());
}