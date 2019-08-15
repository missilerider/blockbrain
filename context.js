'use strict';

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

async function contextContinue(nextStatement) {
  var newBlock  = null;
  var lastRet = undefined;
  try {
    newBlock = findStatement(this.getProgram(), nextStatement);
  } catch(e) {
    log.i("Execution stops due to error");
    log.d(e.stack);
    return;
  }
  while(newBlock != null) {
    let codeBlock;

    try {
      codeBlock = this.getPlugins().getBlockSync(newBlock.block.type);
    } catch {
      console.log("Block type not found:");
      console.dir(newBlock.block);
      throw new Error("Block not found: " + newBlock.block.type)
    }

    this.push();
    this.jump({
      program: newBlock.block,
      block: codeBlock
    });

    this.runFlow.step++;
    log.d("RUN: " + newBlock.block.type + " (" + this.vars.msg.id + ")");
    await codeBlock.run(this);
    this.pop();
    if('next' in newBlock.block && !this.getRunFlow().flowState) {
      newBlock = newBlock.block.next;
    } else {
      newBlock = null;
    }

    //updateContext(this, context);
  }
  return this.getMsg();
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
      var ret = await this.execValue(values[n].block);
      return ret;
    }
  }
  log.e("Node does not contain value named " + name);
  throw new Error("Node does not contain value named " + name);
}

function contextGetMutation(name, defaultValue) {
  log.d("getMutation(" + name + ")");

  if('mutation' in this.getProgram()) {
    if(name in this.getProgram().mutation) {
      return this.getProgram().mutation[name];
    }
  }
  return defaultValue;
}

function cleanVarName(varName) {
  return varName;
}

function contextGetVar(varName) {
  //log.d("getVar(" + varName + ")");
  var v = cleanVarName(varName);
  return this.vars[v];
}

function contextSetVar(varName, newValue) {
  //log.d("setVar(" + varName + ")");
  var v = cleanVarName(varName);
  this.vars[v] = newValue;
}

async function contextExecValue(val) {
  //log.d("execValue(" + val.type + ")");
  var codeBlock;
  try {
    codeBlock = this.plugins.getBlockSync(val.type);
  } catch {
    console.log("Block type not found:");
    console.dir(val);
    throw new Error("Block not found: " + val.type)
  }
  //var context = thisContext;//createContext({ program: val, block: codeBlock });

  this.push(val, codeBlock);

  this.program = val;
  this.block = codeBlock;

  this.step();
  log.d("EXECval: " + val.type);
  console.log("Ejecuta " + this.vars.msg.id);
  let ret = await codeBlock.run(this);
  this.pop();
  return ret;
}

function contextFindName(obj, name) {
  //log.d("contextFindName: " + name);
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
  //log.d("getField(" + name + ")")
  return this.findName(this.getProgram().field, name)['$t'];
}

async function contextGetValue(name) {
  //log.d("getValue(" + name + ")");

  var valueBlock = this.findName(this.getProgram().value, name);
  if('block' in valueBlock)
    return await this.execValue(valueBlock.block);
  else if('shadow' in valueBlock)
    return await this.execValue(valueBlock.shadow);

    log.e("Value not found: " + name);
  throw new Error("Value not found!");
}

function prepare(options) {
  if(!options.program || !options.block) {
    throw new Error("Parameters program and block are mandatory");
  }
  this.plugins = options.plugins;
  this.program = options.program;
  this.block = options.block;
  this.vars["msg"] = options.msg;
}

function clone2(context, options) {
  if(!options.program || !options.block) {
    throw new Error("Parameters program and block are mandatory");
  }

  this.runFlow = this.getRunFlow();
  this.vars = this.getVars();
  this.plugins = this.getPlugins();
}

function contextUpdate(options) {
  this.runFlow = options.runFlow;
  this.vars = options.vars;
}

function push() {
  this.stack.push({
    program: this.program,
    block: this.block
  });
}

function pop() {
  let restore = this.stack.pop();
  this.program = restore.program;
  this.block = restore.block;
}

function Context() {
  this.program = undefined;
  this.block = undefined;
  this.vars = {};
  this.runFlow = {
    step: 0,
    flowState: 0
  };
  this.msg = {};
  this.plugins = {};
  this.stack = [];
}

Context.prototype.execValue = contextExecValue;
Context.prototype.findName = contextFindName;

  // Public funcs
Context.prototype.continue = contextContinue;
Context.prototype.exit = contextExit;
Context.prototype.getParam = contextGetParam;
Context.prototype.getField = contextGetField;
Context.prototype.getValue = contextGetValue;
Context.prototype.getMutation = contextGetMutation;
Context.prototype.getVar = contextGetVar;
Context.prototype.setVar = contextSetVar;
Context.prototype.getMsg = function() { return this.vars.msg; };
Context.prototype.getVars = function() { return this.vars; };
Context.prototype.getRunFlow = function() { return this.runFlow; };
Context.prototype.update = contextUpdate;
Context.prototype.step = function() { this.runFlow.step++; };
Context.prototype.clone2 = clone2;
Context.prototype.prepare = prepare;
Context.prototype.getPlugins = function() { return this.plugins; };
Context.prototype.getProgram = function() { return this.program; };
Context.prototype.getBlock = function() { return this.block; };
Context.prototype.jump = function(options) { this.program = options.program; this.block = options.block; };
Context.prototype.push = push;
Context.prototype.pop = pop;
Context.prototype.sleep = function(ms) { return new Promise(resolve => { setTimeout(resolve,ms); }) };


module.exports = {
  Context: Context
}
