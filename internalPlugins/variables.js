async function variables_set(context) {
  var varName = context.getField(context, "VAR");
  var varValue = await context.getValue(context, "VALUE");

  context.setVar(context, varName, varValue);
}

async function variables_get(context) {
  var varName = context.getField(context, "VAR");

  return context.getVar(context, varName);
}

function getBlocks() {
  return {
    "variables_set": { run: variables_set },
    "variables_get": { run: variables_get }
  }
}

module.exports = {
  getBlocks: getBlocks
}
