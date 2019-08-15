async function variables_set(context) {
  var varName = context.getField("VAR");
  var varValue = await context.getValue("VALUE");

  context.setVar(varName, varValue);
}

async function variables_get(context) {
  var varName = context.getField("VAR");

  return context.getVar(varName);
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
