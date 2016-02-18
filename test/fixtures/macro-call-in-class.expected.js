
class SomeClass {
  foo() {
    let _foo;

    _foo = 'foo';

    return _foo;
  }
}
export default function demo() {
  return new SomeClass().foo();
}