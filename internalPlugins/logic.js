async function controls_if(context) {
  var cond = await context.getValue('IF0');

  if(cond) {
    await context.continue("DO0");
  }
}

async function logic_operation(context) {
  var op = context.getField("OP");
  var a = await context.getValue("A");
  var b = await context.getValue("B");

  log.dump("OP", op);
  log.dump("A", a);
  log.dump("B", b);

  switch(op) {
    case "OR": return a || b;
    case "AND": return a && b;
  }
  return FALSE;
}

async function logic_boolean(context) {
  return context.getField("BOOL") == "TRUE";
}

module.exports = {
  "controls_if": { run: controls_if },
  "logic_operation": { run: logic_operation },
  "logic_boolean": { run: logic_boolean }
}
