

export default function demo() {
  const _input3 = [1, 2, 3, 4, 5];

  let _map;

  const _length = _input3.length;
  const _result = new Array(_length);
  for (let _i3 = 0; _i3 < _length; _i3++) {
    _result[_i3] = _input3[_i3] + 1;
  }
  _map = _result;
  const _input = _map;

  let _filter;

  const _filtered = [];
  for (let _i = 0; _i < _input.length; _i++) {
    if (_input[_i] <= 5) {
      _filtered.push(_input[_i]);
    }
  }
  _filter = _filtered;
  const _input5 = [1, 2, 3, 4, 5];

  let _map2;

  const _length2 = _input5.length;const _result2 = new Array(_length2);for (let _i5 = 0; _i5 < _length2; _i5++) {
    _result2[_i5] = _input5[_i5] + 1;
  }_map2 = _result2;
  const _input4 = _map2;

  let _filter3;

  const _filtered3 = [];for (let _i4 = 0; _i4 < _input4.length; _i4++) {
    if (_input4[_i4] <= 5) {
      _filtered3.push(_input4[_i4]);
    }
  }_filter3 = _filtered3;
  const _input2 = _filter3;

  let _filter2;

  const _filtered2 = [];for (let _i2 = 0; _i2 < _input2.length; _i2++) {
    if (_input2[_i2] > 3) {
      _filtered2.push(_input2[_i2]);
    }
  }_filter2 = _filtered2;

  return [_filter, _filter2];
}