async function text(context) {
  //return context.program.field['$t'];
  return context.getField("TEXT");
}

async function text_join(context) {
  var mut = parseInt(context.program.mutation.items);
  var ret = "";
  for(let n = 0; n < mut; n++) {
    //ret += await context.execValue(context.program.value[n].block);
    ret += await context.getValue("ADD" + n);
  }
  return ret;
}

async function text_charAt(context) {
  var where = context.getField("WHERE");
  var value  = await context.getValue("VALUE");

  switch(where) {
    case 'FROM_START':
      var at = await context.getValue("AT");
      return value.charAt(at);

    case 'FROM_END':
      var at = await context.getValue("AT");
      return value.charAt(value.length - at - 1);

    case 'FIRST':
      return value.charAt(0);

    case 'LAST':
      return value.charAt(value.length - 1);

    case 'RANDOM':
      var at = Math.floor(Math.random() * value.length);
      return value.charAt(at);

    default:
      log.e("text_charAt malformed. Cannot understand WHERE = " + where);
      throw new Error("text_charAt malformed");
  }
}

async function text_changeCase(context) {
  var optionCase = context.getField("CASE");
  var value  = await context.getValue("TEXT");

  switch(optionCase) {
    case "UPPERCASE":
      return value.toUpperCase();

    case "LOWERCASE":
      return value.toLowerCase();

    case "TITLECASE":
      var ret = [];
      arr = value.split(" ");
      for(let n = 0; n < arr.length; n++)
        ret.push(arr[n].charAt(0).toUpperCase() + arr[n].slice(1).toLowerCase());
      return ret.join(' ');

    default:
      log.e("text_changeCase malformed. Cannot understand CASE = " + optionCase);
      throw new Error("text_changeCase malformed");
  }
}

async function text_trim(context) {
  var mode = context.getField("MODE");
  var value  = await context.getValue("TEXT");

  switch(mode) {
    case "BOTH":
      return value.trim();

    case "LEFT":
      return value.trimLeft();

    case "RIGHT":
    return value.trimRight();

    default:
      log.e("text_trim malformed. Cannot understand MODE = " + mode);
      throw new Error("text_trim malformed");
  }
}

module.exports = {
  "text": { run: text },
  "text_join": { run: text_join },
  "text_charAt": { run: text_charAt },
  "text_changeCase": { run: text_changeCase },
  "text_trim": { run: text_trim }
}
