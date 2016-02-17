

export default function demo() {
  const _input = [1, 2, 3];

  let _some;

  _SOME: {
    const _length = _input.length;
    for (let _i = 0; _i < _length; _i++) {
      if (_input[_i] > 2) {
        _some = true;
        break _SOME;
      }
    }
    _some = false;
  }

  return _some;
}