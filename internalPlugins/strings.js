const slog = global.slog;

async function text(context) {
  context.blockIn();
  console.dir(context.getProgram());
  let txt = context.getField("TEXT");
  if(!txt) txt = "";
  else txt = txt.toString();
  slog.d("text: " + txt);
  return txt;
}

async function text_join(context) {
  context.blockIn();
  var mut = parseInt(context.getMutation("items"));
  var ret = "";
  for(let n = 0; n < mut; n++) {
    //ret += await context.execValue(context.program.value[n].block);
    let txt = await context.getValue("ADD" + n);
    if(txt !== undefined && txt !== null)
      txt = txt.toString();

      slog.d("join: " + txt);
    ret += txt;
  }
  return ret;
}

async function text_charAt(context) {
  context.blockIn();
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
      slog.e("text_charAt malformed. Cannot understand WHERE = " + where);
      throw new Error("text_charAt malformed");
  }
}

async function text_changeCase(context) {
  context.blockIn();
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
      slog.e("text_changeCase malformed. Cannot understand CASE = " + optionCase);
      throw new Error("text_changeCase malformed");
  }
}

async function text_trim(context) {
  context.blockIn();
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
      slog.e("text_trim malformed. Cannot understand MODE = " + mode);
      throw new Error("text_trim malformed");
  }
}

async function text_print(context) {
  context.blockIn();
  let value  = await context.getValue("TEXT");
  if(value == null)
    slog.p("nullable");
  else {
    if(Array.isArray(value)) {
      slog.p("[" + value.toString() + "]");
    } else if(typeof(value) == "object") {
      slog.p(JSON.stringify(value, null, 2));
    }
    else
      slog.p(value);
  }
}

async function getBlocks() {
  return {
    "text": { run: text },
    "text_join": { run: text_join },
    "text_charAt": { run: text_charAt },
    "text_changeCase": { run: text_changeCase },
    "text_trim": { run: text_trim },
    "text_print": { run: text_print }
  }
}

module.exports = {
  getBlocks: getBlocks
}
