

const foo = 123;

function bar() {
  return 123;
}

export default function demo() {
  let _double;

  const _result = 2;
  _double = foo * _result;

  const _id = bar();

  let _double2;

  const _result2 = 2;_double2 = _id * _result2;

  return _double + _double2;
}