function f1() {
  return function () {
    return "inner";
  };
}
function f2() {
  return function () {
    return "inner";
  };
}

export default function demo() {
  return [f1()(), f2()()];
}