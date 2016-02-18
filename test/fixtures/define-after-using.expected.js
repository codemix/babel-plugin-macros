function f1() {
  return ["before", "after"];
}
function f2() {
  return ["before", "after"];
}

export default function demo() {
  return [f1(), f2()];
}