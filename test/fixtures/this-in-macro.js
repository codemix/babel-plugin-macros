DEFINE_MACRO(ID, function() {
  return this;
});

function foo2 () {
  return ID();
}

export default function demo () {
  return foo2.call({foo:'bar'});
}