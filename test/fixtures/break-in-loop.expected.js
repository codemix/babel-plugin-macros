

export default function demo() {
  const _arr = [1, 2, 3];

  let _some;

  _SOME: {
    var _result = false,
        _ended = false;
    if (!_arr.length) {
      _some = _result;
      break _SOME;
    }
    for (var _i = 0; _i < _arr.length; _i++) {
      if (_arr[_i] > 2) {
        _result = true;
        break;
      }
    }
    _ended = true;
    _some = [_ended, _result];
  }

  const _arr2 = [1, 2, 3];

  let _some2;

  _SOME3: {
    var _result2 = false,
        _ended2 = false;
    if (!_arr2.length) {
      _some2 = _result2;
      break _SOME3;
    }
    _SOME2: for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      if (_arr2[_i2] > 2) {
        _result2 = true;
        break _SOME2;
      }
    }
    _ended2 = true;
    _some2 = [_ended2, _result2];
  }

  const _arr3 = [1, 2, 3];

  let _some3;

  _SOME4: {
    var _result3 = false,
        _ended3 = false;
    if (!_arr3.length) {
      _some3 = _result3;
      break _SOME4;
    }
    SOME3: for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      if (_arr3[_i3] > 2) {
        _result3 = true;
        break SOME3;
      }
    }
    _ended3 = true;
    _some3 = [_ended3, _result3];
  }

  const _arr4 = [1, 2, 3];

  let _some5;

  let _some6;

  _SOME5: {
    var _result5 = false,
        _ended5 = false;if (!_arr4.length) {
      _some6 = _result5;
      break _SOME5;
    }for (var _i5 = 0; _i5 < _arr4.length; _i5++) {
      if (_arr4[_i5] > 2) {
        _result5 = true;break;
      }
    }_ended5 = true;_some6 = [_ended5, _result5];
  }

  _some5 = _some6;

  return [_some, _some2, _some3, _some5];
}