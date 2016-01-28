DEFINE_MACRO(ID, function() {
  return arguments;
});

function foo2 () {
  return ID();
}

export default function demo () {
  return foo2({foo:'bar'});
}