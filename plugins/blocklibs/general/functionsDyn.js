'use strict';

const log = global.log;
const slog = global.slog;

let blocks = [];

function getInfo(env) {
  return {
    "id": "fn",
    "name": "User functions management utility",
    "author": "Alfonso Vila"
  }
}

function runBlock(context) {
  log.d("RUN BLOCK!!");
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

function getBlocks() {
  fetchBlocks();
  
  let ret = {};
  
  for(let n = 0; n < blocks.length; n++) {
    let block = createBlock(blocks[n]);
    ret[block.block.type] = block;
  }

  log.dump("blocks", ret);

  return ret;
}

function fetchBlocks() {
  blocks = [
    {
      name: "Func Name",
      section: "User functions", 
      params: { "param1": { var: true }, param2: { var: false } },
      returns: [ "ret" ], 
      tooltip: "adfvsdfbe", 
      color: 330
    },
    {
      name: "Func Name2",
      section: "User functions", 
      params: { "param1": { var: false }, param2: { var: true }, para3: { var: false } },
      returns: [ "ret", "ret2", "return que te pasas" ],
      tooltip: "Tooltip 2", 
      color: "aaaaaa"
    }
  ];
}

function getServices() {
  return {};
}

function getToolbox() {
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
