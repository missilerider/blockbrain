async function variables_set(context) {
  context.blockIn();

  var varName = context.getField("VAR");
  var varValue = await context.getValue("VALUE");

/*  if(Array.isArray(varValue)) {
    varValue = varValue.slice(0);
  }
  else if(typeof(varValue) == "object") {
    varValue = Object.assign({}, varValue);
  }*/

  context.setVar(varName, varValue);
}

async function variables_get(context) {
  context.blockIn();

  var varName = context.getField("VAR");
  let ret = context.getVar(varName);

  if(Array.isArray(ret)) {
    return ret.slice(0);
  }
  else if(typeof(ret) == "object") {
    return Object.assign({}, ret);
  } else
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
