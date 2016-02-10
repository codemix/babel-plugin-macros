macro: function FOO() {
  return 'foo';
}
class SomeClass {
  foo() {
    return FOO();
  }
}
export default function demo () {
  return new SomeClass().foo();
}