const log = global.log;

async function controls_if(context) {
  var cond;
  var mutElseIf = context.getMutation(context, 'elseif', 0);
  var mutElse = context.getMutation(context, 'else', false);

  for(let n = 0; n <= mutElseIf; n++) {
    cond = await context.getValue(context, 'IF' + n);
    if(cond) {
      await context.continue(context, "DO" + n);
      return;
    }
  }

  if(mutElse) {
    await context.continue(context, "ELSE");
    return;
  }
}

async function logic_operation(context) {
  var op = context.getField(context, "OP");
  var a = await context.getValue(context, "A");
  var b = await context.getValue(context, "B");

  switch(op) {
    case "OR": return a || b;
    case "AND": return a && b;
  }
  return FALSE;
}

async function logic_boolean(context) {
  return context.getField(context, "BOOL") == "TRUE";
}

async function logic_null(context) {
  return null;
}

async function logic_negate(context) {
  return !(await context.getValue(context, "BOOL"));
}

async function logic_compare(context) {
  var op = context.getField(context, "OP");
  var a = await context.getValue(context, "A");
  var b = await context.getValue(context, "B");

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
  var opIf = await context.getValue(context, "IF");
  var opThen = await context.getValue(context, "THEN");
  var opElse = await context.getValue(context, "ELSE");

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
