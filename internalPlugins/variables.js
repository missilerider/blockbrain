async function variables_set(context) {
  context.blockIn();

  var varName = context.getField("VAR");
  var varValue = await context.getValue("VALUE");

  context.setVar(varName, varValue);
}

async function variables_get(context) {
  context.blockIn();

  var varName = context.getField("VAR");
  let ret = context.getVar(varName); // Always reference safe!

  return ret;

}

async function getBlocks() {
  return {
    "variables_set": { run: variables_set },
    "variables_get": { run: variables_get }
  }
}

module.exports = {
  getBlocks: getBlocks
}
