var value = 'foo';
DEFINE_MACRO(GET_VALUE, function() {
  return value;
});

export default function demo () {
  var value = 'bar';
  return GET_VALUE();
}