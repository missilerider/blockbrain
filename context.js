'use strict';

const log = global.log;
const slog = global.slog;

var executionNumber = 0;

class Context {
  constructor(options) {
    this.executionId = options.executionId;

    if(!options.program || !options.block) {
      throw new Error("Parameters program and block are mandatory");
    }
    this.plugins = options.plugins;
    this.program = options.program;
    this.block = options.block;
    this.vars = {
      "msg": Object.assign({}, options.msg)
    };

    this.runFlow = {
      step: 0,
      flowState: 0
    };
    this.msg = {};
    this.stack = [];
  }

  blockIn() {
    slog.i(this.executionId + ": BLOCK " + this.program._attributes.type + " (ID: " + this.program._attributes.id + ")");
    if(slog.getLogLevel() == "DEBUG") {
      if('mutation' in this.program)
        slog.d(this.executionId + ":\tmutation = " + JSON.stringify(this.program.mutation._attributes));

      if('field' in this.program && this.program.field.length > 0) {
        let fields = {};
        if(Array.isArray(this.program.field)) {
        for(let n = 0; n < this.program.field.length; n++)
          fields[this.program.field[n]._attributes.name] = this.program.field[n]._text;
        } else {
          fields[this.program.field._attributes.name] = this.program.field._text
        }
        slog.d(this.executionId + ":\tfield = " + JSON.stringify(fields));
      }

      let values = [];
      if('value' in this.program) {
        if(Array.isArray(this.program.value)) {
          for(let n = 0; n < this.program.value.length; n++)
           values.push(this.program.value[n]._attributes.name);
        } else {
          values = [ this.program.value._attributes.name ];
        }
        slog.d(this.executionId + ":\tvalue = " + JSON.stringify(values));
      }
    }
  }

  findStatement(blockCode, statementName) {
    if('statement' in blockCode) {
      var sts;
      if(!Array.isArray(blockCode.statement)) {
        sts = [ blockCode.statement ];
      } else {
        sts = blockCode.statement;
      }
      for(let n = 0; n < sts.length; n++) {
        if(sts[n]._attributes.name == statementName)
          return sts[n];
      }
      log.e("Statement " + statementName + " not found but requested by node " + blockCode._attributes.name);
      return null; // Statement not found!
    } else {
      log.w("Block " + blockCode._attributes.name + " does not have statements. Requested " + statementName + ".");
      log.dump("blockCode", blockCode);
      return null; // No statements to look for
    }
  }

  async continue(nextStatement) {
    var newBlock  = null;
    var lastRet = undefined;
    try {
      newBlock = this.findStatement(this.getProgram(), nextStatement);
    } catch(e) {
      log.i("Execution stops due to error");
      log.d(e.stack);
      return;
    }
    while(newBlock != null) {
      let codeBlock;

      try {
        codeBlock = this.getPlugins().getBlockSync(newBlock.block._attributes.type);
      } catch {
        log.e("Block type not found:");
        log.e(newBlock.block);
        throw new Error("Block not found: " + newBlock.block._attributes.type)
      }

      this.push();
      this.jump({
        program: newBlock.block,
        block: codeBlock
      });

      this.runFlow.step++;
      log.d("RUN: " + newBlock.block._attributes.type);
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

  exit(code = 0, message = "") {
    console.log("Termina manualmente la ejecucion: " + code + ", " + message);
  }

  async getParam(name) {
    var values;
    if(Array.isArray(this.program.value)) {
      values = this.program.value;
    } else {
      values = [ this.program.value ];
    }

    for(let n = 0; n < values.length; n++) {
      if(values[n]._attributes.name == name) {
        var ret = await this.execValue(values[n].block);
        return ret;
      }
    }
    log.e("Node does not contain value named " + name);
    throw new Error("Node does not contain value named " + name);
  }

  getMutation(name, defaultValue = undefined) {
    log.d("getMutation(" + name + ")");

    if('mutation' in this.getProgram()) {
      if(name in this.getProgram().mutation._attributes) {
        return this.getProgram().mutation._attributes[name];
      }
    }
    return defaultValue;
  }

  cleanVarName(varName) {
    return varName;
  }

  getVar(varName) {
    //log.d("getVar(" + varName + ")");
    var v = this.cleanVarName(varName);
    return this.vars[v];
  }

  setVar(varName, newValue) {
    //log.d("setVar(" + varName + ")");
    var v = this.cleanVarName(varName);
    this.vars[v] = newValue;
  }

  async execValue(val) {
    //log.d("execValue(" + val.type + ")");
    var codeBlock;
    try {
      codeBlock = this.plugins.getBlockSync(val._attributes.type);
    } catch {
      log.e("Block type not found:");
      log.e(val._attributes.type);
      log.dump("block", val);
      throw new Error("Block not found: " + val._attributes.type);
    }
    //var context = thisContext;//createContext({ program: val, block: codeBlock });

    this.push(val, codeBlock);

    this.program = val;
    this.block = codeBlock;

    this.step();
    log.d("EXECval: " + val._attributes.type);
    let ret = await codeBlock.run(this);
    this.pop();
    return ret;
  }

  findName(obj, name) {
    //log.d("contextFindName: " + name);
    var data;
    if(Array.isArray(obj)) {
      data = obj;
    } else {
      data = [ obj ];
    }

    for(let n = 0; n < data.length; n++) {
      if(data[n]._attributes.name == name) return data[n];
    }
    return null;
  }

  getField(name) {
    //log.d("getField(" + name + ")")
    try {
      return this.findName(this.getProgram().field, name)._text;
    } catch {
      log.e("Field does not exists: " + name + " for block " + this.getProgram()._attributes.type + " [" + this.getProgram()._attributes.id +"]");
    }
  }

  async getValue(name, defaultValue = undefined) {
    log.d("getValue(" + name + ")");

    if(!this.getProgram().value) {
      if(defaultValue !== undefined) return defaultValue;
      throw new Error("Value not found!");
    }

    var valueBlock = this.findName(this.getProgram().value, name);
    if(!valueBlock) {
      if(defaultValue !== undefined) return defaultValue;
      log.e("Value does not exists: " + name + " for block " + this.getProgram()._attributes.type + " [" + this.getProgram()._attributes.id +"]");
      return null;
    }

    if('block' in valueBlock)
      return await this.execValue(valueBlock.block);
    else if('shadow' in valueBlock)
      return await this.execValue(valueBlock.shadow);

    if(defaultValue !== undefined)
      return defaultValue;

    // If default value is not defined, must contain a block!
    log.e("Value does not exists: " + name + " for block " + this.getProgram()._attributes.type + " [" + this.getProgram()._attributes.id +"]");
//    throw new Error("Value not found!");
  }

  prepare(options) {
    if(!options.program || !options.block) {
      throw new Error("Parameters program and block are mandatory");
    }
    this.plugins = options.plugins;
    this.program = options.program;
    this.block = options.block;
    this.vars["msg"] = options.msg;
  }

  clone2(context, options) {
    if(!options.program || !options.block) {
      throw new Error("Parameters program and block are mandatory");
    }

    this.runFlow = this.getRunFlow();
    this.vars = this.getVars();
    this.plugins = this.getPlugins();
  }

  update(options) {
    this.runFlow = options.runFlow;
    this.vars = options.vars;
  }

  push() {
    this.stack.push({
      program: this.program,
      block: this.block
    });
  }

  pop() {
    let restore = this.stack.pop();
    this.program = restore.program;
    this.block = restore.block;
  }

  getMsg() { return this.vars.msg; };
  getVars() { return this.vars; };
  getRunFlow() { return this.runFlow; };
  step() { this.runFlow.step++; };
  getPlugins() { return this.plugins; };
  getProgram() { return this.program; };
  getBlock() { return this.block; };
  jump(options) { this.program = options.program; this.block = options.block; };
  sleep(ms) { return new Promise(resolve => { setTimeout(resolve,ms); }) };
}

function createContext(options) {
  options.executionId = newExecutionId(5);
  return new Context(options);
}

function newExecutionId(size) {
  var s = String(executionNumber++);
  while (s.length < (size || 1)) { s = "0" + s; }
  return s;
}

module.exports = {
  Context: Context,
  createContext: createContext
}
