macro: {
  var FOO = function() {
    return "foo";
  };
  var BAR = () => "bar";
  var BAZ = () =>{
    return "baz";
  };
}
macro: var FOO1 = function() {
  return "foo1";
};
macro: var BAR1 = () => "bar1";
macro: var BAZ1 = () =>{
  return "baz1";
};

export default function demo () {
  return [FOO(), BAR(), BAZ(), FOO1(), BAR1(), BAZ1()];
}