const log = global.log;

async function controls_if(context) {
  context.blockIn();
  var cond;
  var mutElseIf = context.getMutation('elseif', 0);
  var mutElse = context.getMutation('else', false);

  for(let n = 0; n <= mutElseIf; n++) {
    cond = await context.getValue('IF' + n);
    if(cond) {
      await context.continue("DO" + n);
      return;
    }
  }

  if(mutElse) {
    await context.continue("ELSE");
    return;
  }
}

async function logic_operation(context) {
  context.blockIn();
  var op = context.getField("OP");
  var a = await context.getValue("A");
  var b = await context.getValue("B");

  switch(op) {
    case "OR": return a || b;
    case "AND": return a && b;
  }
  return FALSE;
}

async function logic_boolean(context) {
  context.blockIn();
  return context.getField("BOOL") == "TRUE";
}

async function logic_null(context) {
  context.blockIn();
  return null;
}

async function logic_negate(context) {
  context.blockIn();
  return !(await context.getValue("BOOL"));
}

async function logic_compare(context) {
  context.blockIn();
  var op = context.getField("OP");
  var a = await context.getValue("A");
  var b = await context.getValue("B");

  switch(op) {
    case "EQ": return a == b;
    case "NEQ": return a != b;
    case "LT": return a < b;
    case "LTE": return a <= b;
    case "GT": return a > b;
    case "GTE": return a >= b;
  }

  return FALSE;
}

async function logic_ternary(context) {
  context.blockIn();
  var opIf = await context.getValue("IF");
  var opThen = await context.getValue("THEN");
  var opElse = await context.getValue("ELSE");

  return opIf ? opThen : opElse;
}

function getBlocks() {
  return {
    "controls_if": { run: controls_if },
    "logic_operation": { run: logic_operation },
    "logic_boolean": { run: logic_boolean },
    "logic_null": { run: logic_null },
    "logic_negate": { run: logic_negate },
    "logic_compare": { run: logic_compare },
    "logic_ternary": { run: logic_ternary }
  }
}

module.exports = {
  getBlocks: getBlocks
}
