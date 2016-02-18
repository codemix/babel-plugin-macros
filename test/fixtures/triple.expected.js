

const foo = 123;

function bar() {
  return 123;
}

export default function demo() {
  const _id = bar();

  return _id + _id + _id + (foo + foo + foo);
}