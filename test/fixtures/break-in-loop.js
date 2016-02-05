DEFINE_MACRO(SOME1, function(arr, func) {
  var result = false,
    ended = false;
  if(!arr.length) {
    return result;
  }
  for(var i = 0; i < arr.length; i++) {
    if(func(arr[i])) {
      result = true;
      break;
    }
  }
  ended = true;
  return [ended, result];
});
DEFINE_MACRO(SOME2, function(arr, func) {
  var result = false,
    ended = false;
  if(!arr.length) {
    return result;
  }
  _SOME2: for(var i = 0; i < arr.length; i++) {
    if(func(arr[i])) {
      result = true;
      break _SOME2;
    }
  }
  ended = true;
  return [ended, result];
});
DEFINE_MACRO(SOME3, function(arr, func) {
  var result = false,
    ended = false;
  if(!arr.length) {
    return result;
  }
  SOME3: for(var i = 0; i < arr.length; i++) {
    if(func(arr[i])) {
      result = true;
      break SOME3;
    }
  }
  ended = true;
  return [ended, result];
});
DEFINE_MACRO(SOME4, function(arr, func) {
  return SOME1(arr, func);
});

export default function demo () {
  return [
    SOME1([1, 2, 3], item => item > 2),
    SOME2([1, 2, 3], item => item > 2),
    SOME3([1, 2, 3], item => item > 2),
    SOME4([1, 2, 3], item => item > 2)
  ];
}