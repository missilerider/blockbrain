var obj, matches;


obj = inputData;

  var matches;
  try {
    var RGX2 = String(prueba).match(/(/(.*)/([ig]*)|.+)/);
    if(RGX2[2] === undefined)
      RGX3 = new RegExp(prueba);
    else
      RGX3 = new RegExp(RGX2[2], RGX2[3]);
    if(matches = String(obj).match(RGX3)) {
      matches.forEach((m) => {
        matches.push(m);
      });
  ...;

    }
  } catch(e) {}
