const log = global.log;

async function text(context) {
  return context.getField(context, "TEXT");
}

async function text_join(context) {
  var mut = parseInt(context.getProgram().mutation.items);
  var ret = "";
  for(let n = 0; n < mut; n++) {
    //ret += await context.execValue(context.program.value[n].block);
    ret += await context.getValue(context, "ADD" + n);
  }
  return ret;
}

async function text_charAt(context) {
  var where = context.getField(context, "WHERE");
  var value  = await context.getValue(context, "VALUE");

  switch(where) {
    case 'FROM_START':
      var at = await context.getValue(context, "AT");
      return value.charAt(at);

    case 'FROM_END':
      var at = await context.getValue(context, "AT");
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
  var optionCase = context.getField(context, "CASE");
  var value  = await context.getValue(context, "TEXT");

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
  var mode = context.getField(context, "MODE");
  var value  = await context.getValue(context, "TEXT");

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

async function text_print(context) {
  var value  = await context.getValue(context, "TEXT");
  var logLevel = log.getLogLevel();
  log.setLogLevel("INFO");
  log.i(value);
  log.setLogLevel(logLevel);
}

module.exports = {
  "text": { run: text },
  "text_join": { run: text_join },
  "text_charAt": { run: text_charAt },
  "text_changeCase": { run: text_changeCase },
  "text_trim": { run: text_trim },
  "text_print": { run: text_print }
}
