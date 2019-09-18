'use strict';

class Context {
  constructor(options) {
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

  findStatement(blockCode, statementName) {
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
        codeBlock = this.getPlugins().getBlockSync(newBlock.block.type);
      } catch {
        log.e("Block type not found:");
        log.e(newBlock.block);
        throw new Error("Block not found: " + newBlock.block.type)
      }

      this.push();
      this.jump({
        program: newBlock.block,
        block: codeBlock
      });

      this.runFlow.step++;
      log.d("RUN: " + newBlock.block.type);
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
      if(values[n].name == name) {
        var ret = await this.execValue(values[n].block);
        return ret;
      }
    }
    log.e("Node does not contain value named " + name);
    throw new Error("Node does not contain value named " + name);
  }

  getMutation(name, defaultValue) {
    log.d("getMutation(" + name + ")");

    if('mutation' in this.getProgram()) {
      if(name in this.getProgram().mutation) {
        return this.getProgram().mutation[name];
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
      codeBlock = this.plugins.getBlockSync(val.type);
    } catch {
      log.e("Block type not found:");
      log.e(val.type);
      throw new Error("Block not found: " + val.type)
    }
    //var context = thisContext;//createContext({ program: val, block: codeBlock });

    this.push(val, codeBlock);

    this.program = val;
    this.block = codeBlock;

    this.step();
    log.d("EXECval: " + val.type);
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
      if(data[n].name == name) return data[n];
    }
    return null;
  }

  getField(name) {
    //log.d("getField(" + name + ")")
    return this.findName(this.getProgram().field, name)['$t'];
  }

  async getValue(name, defaultValue = undefined) {
    //log.d("getValue(" + name + ")");

    if(!this.getProgram().value) {
      if(defaultValue !== undefined) return defaultValue;
      throw new Error("Value not found!");
    }

    var valueBlock = this.findName(this.getProgram().value, name);
    if(!valueBlock) {
      if(defaultValue !== undefined) return defaultValue;
      log.dump("Values", this.getProgram().value);
      throw new Error("Value " + name + " not found!");
    }

    if('block' in valueBlock)
      return await this.execValue(valueBlock.block);
    else if('shadow' in valueBlock)
      return await this.execValue(valueBlock.shadow);

    if(defaultValue !== undefined)
      return defaultValue ;

      // If default value is not defined, must contain a block!
    log.e("Value not found: " + name);
    throw new Error("Value not found!");
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
  return new Context(options);
}

module.exports = {
  Context: Context,
  createContext: createContext
}
