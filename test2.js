'use strict';

const fs = require('fs');
const xml2json = require('xml2json');
if(global.log == undefined)
  global.log = require('./log.js');

const log = global.log;
log.setLogLevel("DEBUG");
const plugins = require('./plugins.js');

plugins.reload();

function findStatement(block, statementName) {
  if('statement' in block) {
    var sts;
    if(!Array.isArray(block.statement)) {
      sts = [ block.statement ];
    } else {
      sts = block.statement;
    }
    for(let n = 0; n < sts.length; n++) {
      if(sts[n].name == statementName)
        return sts[n];
    }
    log.e("Statement " + statementName + " not found but requested by node " + block.name);
    return null; // Statement not found!
  } else {
    log.e("Block " + block.name + " does not have statements. Requested " + statementName + ".");
    return null; // No statements to look for
  }
}

async function contextContinue(context, nextStatement) {
  var newBlock  = null;
  var lastRet = undefined;
  try {
    newBlock = findStatement(this.program, nextStatement);
  } catch {
    log.i("Execution stops due to error");
    return;
  }
  while(newBlock != null) {
    var codeBlock;

    try {
      codeBlock = plugins.getBlockSync(newBlock.block.type);
    } catch {
      console.log("Block type not found:");
      console.dir(newBlock.block);
      throw new Error("Block not found: " + newBlock.block.type)
    }
    let context = {
      continue: contextContinue,
      exit: contextExit,
      getParam: contextGetParam,
      getField: contextGetField,
      getValue: contextGetValue,
      getMutation: contextGetMutation,
      program: newBlock.block,
      this: codeBlock
    };

    lastRet = await codeBlock.run(context);
    if('next' in newBlock.block) {
      newBlock = newBlock.block.next;
    } else {
      newBlock = null;
    }
  }
  return lastRet;
}

function contextExit(code = 0, message = "") {
  console.log("Termina manualmente la ejecucion: " + code + ", " + message);
}

async function contextGetParam(name) {
  var values;
  if(Array.isArray(this.program.value)) {
    values = this.program.value;
  } else {
    values = [ this.program.value ];
  }

  for(let n = 0; n < values.length; n++) {
    if(values[n].name == name) {
      var ret = await contextExecValue(values[n].block);
      return ret;
    }
  }
  log.e("Node does not contain value named " + name);
  throw new Error("Node does not contain value named " + name);
}

function contextGetMutation(name, defaultValue) {
  if('mutation' in this.program) {
    if(name in this.program.mutation) {
      return this.program.mutation[name];
    }
  }
  return defaultValue;
}

async function contextExecValue(val) {
  var codeBlock;
  try {
    codeBlock = plugins.getBlockSync(val.type);
  } catch {
    console.log("Block type not found:");
    console.dir(val);
    throw new Error("Block not found: " + val.type)
  }
  var context = {
    execValue: contextExecValue,
    findName: contextFindName,
    getField: contextGetField,
    getValue: contextGetValue,
    getMutation: contextGetMutation,
    program: val,
    this: codeBlock
  };
  return await codeBlock.run(context);
}

function contextFindName(obj, name) {
  var data;
  if(Array.isArray(obj)) {
    data = obj;
  } else {
    data = [ obj ];
  }

  for(let n = 0; n < data.length; n++) {
    if(data[n].name == name) return data[n];
  }
  return null;
}

function contextGetField(name) {
  return contextFindName(this.program.field, name)['$t'];
}

async function contextGetValue(name) {
  var valueBlock = contextFindName(this.program.value, name);
  if('block' in valueBlock)
    return await contextExecValue(valueBlock.block);
  else if('shadow' in valueBlock)
    return await contextExecValue(valueBlock.shadow);

    log.e("Value not found: " + name);
  throw new Error("Value not found!");
}

fs.readFile('./vault/1234.xml', function(err, data) {
  var json = JSON.parse(xml2json.toJson(data, { reversible: false, trim: false }));

  var blocks;
  if(Array.isArray(json.xml.block)) {
    blocks = json.xml.block;
  } else {
    blocks = [ json.xml.block ];
  }

  // Root elements
  blocks.forEach(block => {
    plugins.getBlock(block.type, async (err, codeBlock) => {
      if(err) {
        console.log("Error: " + codeBlock);
      } else {
        let context = {
          continue: contextContinue,
          exit: contextExit,
          getParam: contextGetParam,
          getField: contextGetField,
          getMutation: contextGetMutation,
          program: block,
          this: codeBlock
        };

        codeBlock.run(context);
      }
    }).then().catch(() => {
      console.log("Block type not found:");
      console.dir(block);
      throw new Error("Block not found: " + block.type)
    });
  });
});
