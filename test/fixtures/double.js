DEFINE_MACRO(DOUBLE, (id) => {
  const result = 2;
  return id * result;
});


const foo = 123;

function bar () {
  return 123;
}

export default function demo () {
  return DOUBLE(foo) + DOUBLE(bar());
}