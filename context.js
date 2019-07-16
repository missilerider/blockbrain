'use strict';

var program = undefined;
var block = undefined;
var vars = {};
var runFlow = {
  step: 0,
  flowState: 0
};
var msg = {};
var plugins = {};
var stack = [];

function findStatement(blockCode, statementName) {
  if('statement' in blockCode) {
    var sts;
    if(!Array.isArray(blockCode.statement)) {
      sts = [ blockCode.statement ];
    } else {
      sts = blockCode.statement;
    }
    for(let n = 0; n < sts.length; n++) {
      if(sts[n].name == statementName)
        return sts[n];
    }
    log.e("Statement " + statementName + " not found but requested by node " + blockCode.name);
    return null; // Statement not found!
  } else {
    log.w("Block " + blockCode.name + " does not have statements. Requested " + statementName + ".");
    log.dump("blockCode", blockCode);
    return null; // No statements to look for
  }
}

async function contextContinue(currentContext, nextStatement) {
  var newBlock  = null;
  var lastRet = undefined;
  try {
    newBlock = findStatement(currentContext.getProgram(), nextStatement);
  } catch(e) {
    log.i("Execution stops due to error");
    log.d(e.stack);
    return;
  }
  while(newBlock != null) {
    var codeBlock;

    try {
      codeBlock = currentContext.getPlugins().getBlockSync(newBlock.block.type);
    } catch {
      console.log("Block type not found:");
      console.dir(newBlock.block);
      throw new Error("Block not found: " + newBlock.block.type)
    }

    currentContext.push();
    currentContext.jump({
      program: newBlock.block,
      block: codeBlock
    });

    runFlow.step++;
    log.d("RUN: " + newBlock.block.type);
    await codeBlock.run(currentContext);
    currentContext.pop();
    if('next' in newBlock.block && !currentContext.getRunFlow().flowState) {
      newBlock = newBlock.block.next;
    } else {
      newBlock = null;
    }

    //updateContext(this, context);
  }
  return currentContext.getMsg();
}

function contextExit(code = 0, message = "") {
  console.log("Termina manualmente la ejecucion: " + code + ", " + message);
}

async function contextGetParam(context, name) {
  var values;
  console.log("progrtama: " + name);
  console.dir(program);
  if(Array.isArray(program.value)) {
    values = program.value;
  } else {
    values = [ program.value ];
  }

  for(let n = 0; n < values.length; n++) {
    if(values[n].name == name) {
      var ret = await contextExecValue(context, values[n].block);
      return ret;
    }
  }
  log.e("Node does not contain value named " + name);
  throw new Error("Node does not contain value named " + name);
}

function contextGetMutation(context, name, defaultValue) {
  log.d("getMutation(" + name + ")");

  if('mutation' in context.getProgram()) {
    if(name in context.getProgram().mutation) {
      return context.getProgram().mutation[name];
    }
  }
  return defaultValue;
}

function cleanVarName(varName) {
  return varName;
}

function contextGetVar(varName) {
  log.d("getVar(" + varName + ")");
  var v = cleanVarName(varName);
  console.dir(this.var);
  return this.var[v];
}

function contextSetVar(varName, newValue) {
  log.d("setVar(" + varName + ")");
  var v = cleanVarName(varName);
  //log.dump("SetVar", this.var);
  this.var[v] = newValue;
  //log.dump("SetVar", this.var);
}

async function contextExecValue(context, val) {
  log.d("execValue(" + val.type + ")");
  var codeBlock;
  try {
    codeBlock = plugins.getBlockSync(val.type);
  } catch {
    console.log("Block type not found:");
    console.dir(val);
    throw new Error("Block not found: " + val.type)
  }
  //var context = thisContext;//createContext({ program: val, block: codeBlock });

  context.push(val, codeBlock);

  program = val;
  block = codeBlock;

  context.step();
  log.d("RUN: " + val.type);
  let ret = await codeBlock.run(context);
  context.pop();
  return ret;
}

function contextFindName(context, obj, name) {
  log.d("contextFindName: " + name);
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

function contextGetField(context, name) {
  log.d("getField(" + name + ")")
  return contextFindName(context, context.getProgram().field, name)['$t'];
}

async function contextGetValue(context, name) {
  log.d("getValue(" + name + ")");

  var valueBlock = contextFindName(context, context.getProgram().value, name);
  if('block' in valueBlock)
    return await contextExecValue(context, valueBlock.block);
  else if('shadow' in valueBlock)
    return await contextExecValue(context, valueBlock.shadow);

    log.e("Value not found: " + name);
  throw new Error("Value not found!");
}

function prepare(options) {
  if(!options.program || !options.block) {
    throw new Error("Parameters program and block are mandatory");
  }
  plugins = options.plugins;
  program = options.program;
  block = options.block;
  msg = options.msg;
}

function clone2(context, options) {
  if(!options.program || !options.block) {
    throw new Error("Parameters program and block are mandatory");
  }

  runFlow = context.getRunFlow();
  vars = context.getVars();
  plugins = context.getPlugins();
}

function contextUpdate(options) {
  runFlow = options.runFlow;
  vars = options.vars;
}

function push() {
  stack.push({
    program: program,
    block: block
  });
}

function pop() {
  let restore = stack.pop();
  program = restore.program;
  block = restore.block;
}

module.exports = {
  continue: contextContinue,
  exit: contextExit,
  getParam: contextGetParam,
  getField: contextGetField,
  getValue: contextGetValue,
  getMutation: contextGetMutation,
  getVar: contextGetVar,
  setVar: contextSetVar,
  program: program,
  this: block,
  getMsg: () => { return msg; },
  getVars: () => { return vars; },
  getRunFlow: () => { return runFlow; },
  update: contextUpdate,
  step: () => { runFlow.step++; },
  clone2: clone2,
  prepare: prepare,
  getPlugins: () => { return plugins; },
  getProgram: () => { return program; },
  getBlock: () => { return block; },
  jump: (options) => { program = options.program; block = options.block; },
  push: push,
  pop: pop,
  sleep: (ms) => { return new Promise(resolve => { setTimeout(resolve,ms); }) }
}
