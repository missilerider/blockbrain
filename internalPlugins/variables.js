async function variables_set(context) {
  var varName = context.getField(context, "VAR");
  var varValue = await context.getValue(context, "VALUE");

  context.setVar(varName, varValue);
}

async function variables_get(context) {
  var varName = context.getField(context, "VAR");

  console.dir(context.var);
  return context.getVar(varName);
}

module.exports = {
  "variables_set": { run: variables_set },
  "variables_get": { run: variables_get }
}
