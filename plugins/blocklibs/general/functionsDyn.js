'use strict';

const log = global.log;
const slog = global.slog;
var runtimeUtils = null;

function getInfo(env) {
  return {
    "id": "fn",
    "name": "User functions management utility",
    "author": "Alfonso Vila"
  }
}

async function runBlock(context) {
  context.blockIn();

  let vars = {};
  let rets = [];

  let fields = context.getFields();
  if(fields != null) {
    let fieldIds = Object.keys(fields);
    for(let n = 0; n < fieldIds.length; n++) {
      let parts = fieldIds[n].match(/^CONST_(.*)$/);
      if(parts) {
        vars[parts[1]] = context.getField(parts[0]);
        continue;
      }

      parts = fieldIds[n].match(/^RET_(.*)$/);
      if(parts) {
        rets.push(parts[1]);
        continue;
      }
    }
  }

  let values = context.getValues();
  if(values != null) {
    for(let n = 0; n < values.length; n++) {
      let parts = values[n].match(/^VAR_(.*)$/);
      if(parts) {
        vars[parts[1]] = await context.getValue(parts[0]);
        continue;
      }
    }
  }

  let ret = await runtimeUtils.executeEvent('fn_fn', context.vars, vars);

  if(ret.length > 0) {
    ret = ret[0]; // Single execution only supported!!

    for(let n = 0; n < rets.length; n++) {
      let localVar = context.getField("RET_" + rets[n]);
      context.setVar(localVar, ret[rets[n]]);
      log.d("Variable output " + localVar + " = " + (ret[rets[n]] || "nullable"));
    }
  }
}

function createBlock(data) {
  let b = {};

  let fnName = data.name;
  let fnMessage = fnName;
  let params = data.params;
  let paramsIds = Object.keys(params);
  let returns = data.returns;
  let args0 = [];

  let m = 1;
  let lastDummy = true;

  for(let n = 0; n < paramsIds.length; n++) {
    if(params[paramsIds[n]].var) {
      if(lastDummy) {
        args0.push({
          "type": "input_dummy"
        });
        fnMessage += " %" + (m++);
      }

      args0.push({ // value input
        "type": "input_value",
        "name": "VAR_" + paramsIds[n]
      });

      fnMessage += " " + paramsIds[n] + " %" + (m++);

      lastDummy = false;
    } else { // dummy input
      if(lastDummy) {
        args0.push({
          "type": "input_dummy"
        });
        fnMessage += " %" + (m++);
      }

      args0.push({
        "type": "field_input",
        "name": "CONST_" + paramsIds[n],
        "text": paramsIds[n]
      });

      fnMessage += " " + paramsIds[n] + " %" + (m++);

      lastDummy = true;
    }
  }

  for(let n = 0; n < returns.length; n++) {
    if(lastDummy) {
      args0.push({
        "type": "input_dummy"
      });
      fnMessage += " %" + (m++);
    }
    
    args0.push({
      "type": "field_variable",
      "name": "RET_" + returns[n],
      "variable": returns[n]
    });

    fnMessage += " return " + returns[n] + " %" + (m++);

    lastDummy = true;
  }

  b.block = {
    "type": "USER_" + fnName,
    "message0": fnMessage,
    "previousStatement": null,
    "nextStatement": null,
    "colour": data.color,
    "tooltip": data.tooltip,
    "helpUrl": ""
  };

  if(args0.length > 0)
    b.block.args0 = args0;

  b.run = runBlock;

  return b;
}

async function getBlocks(services, utils) {
  runtimeUtils = utils;
  let blocks = await fetchBlocks(services, utils);

  let ret = {};

  for(let n = 0; n < blocks.length; n++) {
    let block = createBlock(blocks[n]);
    ret[block.block.type] = block;
  }

  return ret;
}

async function fetchBlocks(services, utils) {
  let blocks = await utils.executeEvent('fn_fn', { "___Custom Function Definition": true });

  return blocks;
}

function getServices() {
  return {};
}

async function getToolbox(services, utils) {
  let blocks = await fetchBlocks(services, utils);
  let palette = {};

  for(let n = 0; n < blocks.length; n++) {
    if(!(blocks[n].section in palette)) 
      palette[blocks[n].section] = "";

      palette[blocks[n].section] += '<block type="fn.USER_' + blocks[n].name + '"></block>';
  }

  return {
    "user functions": palette
  };
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
