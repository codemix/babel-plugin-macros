

export default function demo() {
  const _input = [1, 2, 3, 4];

  let _map;

  const _length = _input.length;
  const _result = new Array(_length);
  for (let _i = 0; _i < _length; _i++) {
    _result[_i] = _input[_i] + 1;
  }
  _map = _result;

  return _map;
}