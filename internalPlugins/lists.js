const log = global.log;
const slog = global.slog;

async function list_repeat(context) {
  context.blockIn();
  var num = await context.getValue("NUM");
  var item  = await context.getValue("ITEM");
  let ret = [];
  for(let n = 0; n < num; n++) ret.push(item);
  return ret;
}

async function lists_create_with(context) {
  context.blockIn();
  var mut = parseInt(context.getMutation("items"));
  var ret = [];
  for(let n = 0; n < mut; n++) {
    ret.push(await context.getValue("ADD" + n));
  }
  return ret;
}

async function lists_length(context) {
  context.blockIn();
  var value = await context.getValue("VALUE");
  if(Array.isArray(value)) {
    slog.e("VALUE must be a list");
    return null;
  }
  return -1;
}

async function lists_isEmpty(context) {
  context.blockIn();
  var value = await context.getValue("VALUE");
  if(Array.isArray(value)) return value.length === 0;
  slog.e("VALUE must be a list");
  return null;
}

async function lists_indexOf(context) {
  context.blockIn();
  var value  = await context.getValue("VALUE");
  if(!Array.isArray(value)) {
    slog.e(context, "VALUE must be a list");
    return null;
  }
  var end = context.getField("END");
  var find  = await context.getValue("FIND");

  switch(end) {
    case 'FIRST':
      return value.indexOf(find);

    case 'LAST':
      return value.lastIndexOf(find);

    default:
      slog.e("lists_indexOf malformed. Cannot understand END = " + end);
      throw new Error("text_charAt malformed");
  }
}

async function lists_getIndex(context) {
  context.blockIn();
  let value  = await context.getValue("VALUE");
  if(!Array.isArray(value)) {
    slog.e("VALUE must be a list");
    return null;
  }
  let mode = context.getField("MODE");
  let where = context.getField("WHERE");

  let at;

  switch(where) {
    case "FIRST":
      at = 1;
      break;
      
    case "LAST":
      at = value.length;
      break;
          
    case "FROM_START":
      at  = await context.getValue("AT");
      break;

    case "FROM_END":
      at  = value.length - (await context.getValue("AT")) + 1;
      break;

    case "RANDOM":
      at = Math.floor(1 + Math.random() * value.length);
      break;
    }

  if(at > value.length || at < 1) {
    slog.e("Index out of bounds: 1 <= " + at + " <= " + value.length);
    return null;
  }

  switch(mode) {
    case "GET":
      return value[at-1];

    case "GET_REMOVE":
      let ret = value[at-1];
      value.splice(at-1);
      return ret;

    case "REMOVE":
      value.splice(at-1);
      break;
  }
}

async function lists_getSublist(context) {
  context.blockIn();

  let value  = await context.getValue("LIST");
  if(!Array.isArray(value)) {
    slog.e("VALUE must be a list");
    return null;
  }
  let where1 = context.getField("WHERE1");
  let where2 = context.getField("WHERE2");

  let at1, at2;

  if(context.getMutation("at1") == "true")
    at1 = await context.getValue("AT1");

  if(context.getMutation("at2") == "true")
    at2 = await context.getValue("AT2");

  switch(where1) {
    case "FROM_START": 
      at1 = await context.getValue("AT1");
      break;

    case "FROM_END": 
      at1 = value.length - await context.getValue("AT1") + 1;
      break;

    case "FIRST": 
      at1 = 1;
      break;
  }

  switch(where2) {
    case "FROM_START": 
      at2 = await context.getValue("AT2") + 1;
      break;

    case "FROM_END": 
      at2 = value.length - await context.getValue("AT2") + 1;
      break;

    case "LAST": 
      at2 = value.length;
      break;
  }

  if(at1 > value.length || at1 < 1) {
    slog.e("Index FROM out of bounds: 1 <= " + at1 + " <= " + value.length);
    return null;
  }

  if(at2 > value.length || at2 < 1) {
    slog.e("Index TO out of bounds: 1 <= " + at2 + " <= " + value.length);
    return null;
  }

  slog.d("at: " + at1 + ", " + at2);

  return value.slice(at1 - 1, at2);
}

async function lists_setIndex(context) {
  context.blockIn();

  let mode = context.getField("MODE");
  let where = context.getField("WHERE");

  let list = await context.getValue("LIST");

  if(!Array.isArray(list)) {
    slog.e("LIST must be a list");
    return null;
  }

  let to = await context.getValue("TO");

  let at;

  switch(where) {
    case "FIRST":
      at = 1;
      break;
      
    case "LAST":
      at = list.length;
      break;
          
    case "FROM_START":
      at  = await context.getValue("AT");
      break;

    case "FROM_END":
      at  = list.length - (await context.getValue("AT")) + 1;
      break;

    case "RANDOM":
      at = Math.floor(1 + Math.random() * list.length);
      break;
  }

switch(mode) {
  case "SET":
      if(at > list.length || at < 1) {
        slog.e("Index AT out of bounds: 1 <= " + at + " <= " + list.length);
        return null;
      }

      list[at-1] = to;
      break;

    case "INSERT":
      if(at > list.length || at < 1) {
        slog.w("Index AT out of bounds: 1 <= " + at + " <= " + list.length + ". Cutting off excess!");
        at = Math.max(0, Math.min(at, list.length));
      }

      return list.splice(at - 1, 0, to);
}

}

async function lists_split(context) {
  context.blockIn();

  let input = await context.getValue("INPUT");

  if(!Array.isArray(list)) {
    slog.e("INPUT must be a list");
    return null;
  }

  let delim = await context.getValue("DELIM");

  switch(context.getMutation("mode")) {
    case "SPLIT": 
      return input.toString().split(delim);

    case "JOIN":
      return input.toString().join(delim);
  }
}

async function lists_sort(context) {
  context.blockIn();

  let type = context.getField("TYPE");
  let direction = context.getField("DIRECTION");

  let list = await context.getValue("LIST");

  if(!Array.isArray(list)) {
    slog.e("LIST must be a list");
    return null;
  }

  list = list.slice(0);

  slog.dump("num", list.sort((a,b) => a-b));

  switch(type) {
    case "NUMERIC":
      return direction == "1" ? list.sort((a,b) => a-b) : list.sort((a,b) => b-a);
    case "TEXT":
      if(direction == "1") {
        return list.sort(function (a, b) {
          return a.toString().localeCompare(b.toString());
        });
      } else {
        return list.sort(function (a, b) {
          return b.toString().localeCompare(a.toString());
        });
      }
    case "IGNORE_CASE":
      if(direction == "1") {
        return list.sort(function (a, b) {
          return a.toString().toLowerCase().localeCompare(b.toString().toLowerCase());
        });
      } else {
        return list.sort(function (a, b) {
          return b.toString().toLowerCase().localeCompare(a.toString().toLowerCase());
        });
      }
    }
  return list.sort();
}

function getBlocks() {
  return {
    "lists_repeat": { run: list_repeat }, 
    "lists_create_with": { run: lists_create_with }, 
    "lists_length": { run: lists_length }, 
    "lists_isEmpty": { run: lists_isEmpty }, 
    "lists_indexOf": { run: lists_indexOf }, 
    "lists_getIndex": { run: lists_getIndex }, 
    "lists_getSublist": { run: lists_getSublist }, 
    "lists_setIndex": { run: lists_setIndex }, 
    "lists_split": { run: lists_split }, 
    "lists_sort": { run: lists_sort }
  }
}

module.exports = {
  getBlocks: getBlocks
}
