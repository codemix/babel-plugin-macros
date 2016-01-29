DEFINE_MACRO(ID, function() {
  return 'foo';
  return 'bar';
});

export default function demo () {
  return ID();
}