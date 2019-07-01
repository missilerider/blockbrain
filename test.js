var inputData = {"d1":"v1", "d2":"v2"};

var obj, prop, value;

obj = inputData;
Object.keys(obj).forEach(function (objdata) {
prop = objdata;value = obj[objdata];
console.log(prop + " = " + value);
});
return;


Object.keys(obj).forEach(function (objdata) {
  var prop = objdata;
  var value = obj[objdata];

  console.log(prop + " = " + value);
});
