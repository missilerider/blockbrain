'use strict';

const log = global.log;
const slog = global.slog;

var jsonBlock = {
  "block": {
    "type": "json",
    "message0": "json %1",
    "args0": [
      {
        "type": "input_value",
        "name": "DATA"
      }
    ],
    "output": "json",
    "colour": 315,
    "tooltip": "Convert to json",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      context.blockIn();

      var data = await context.getValue("DATA");

      if(data === null) return null;

      switch(typeof data) {
        case "object": return data;
        case "number":
        case "string":
        case "boolean":
          return [ data ];
        case "undefined":
        case "function":
          log.f("A function has been used as a variable!");
          throw new Error("Cannot manage function fariables");
      }
    throw new Error("Data type unknown when transforming into json");
  }
}

var jsonStringifyBlock = {
  "block": {
    "type": "json_stringify",
    "message0": "stringify %1",
    "args0": [
      {
        "type": "input_value",
        "name": "JSON",
        "check": "json"
      }
    ],
    "output": "String",
    "colour": 315,
    "tooltip": "Convert to json string definition",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      context.blockIn();
      var json = await context.getValue("JSON");
      return JSON.stringify(json);
  }
}

var jsonStringifyBeautifyBlock = {
  "block": {
    "type": "json_stringify",
    "message0": "stringify and beautify %1",
    "args0": [
      {
        "type": "input_value",
        "name": "JSON",
        "check": "json"
      }
    ],
    "output": "String",
    "colour": 315,
    "tooltip": "Convert to json string definition into a easily readable format",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      context.blockIn();
      var json = await context.getValue("JSON");
      return JSON.stringify(json, null, 2);
  }
}

var jsonParseBlock = {
  "block": {
    "type": "json_parse",
    "message0": "parse json %1",
    "args0": [
      {
        "type": "input_value",
        "name": "DATA"
      }
    ],
    "output": "json",
    "colour": 315,
    "tooltip": "Parse string to json",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      context.blockIn();

      var data = await context.getValue("DATA");

      if(data === null) return null;

      return JSON.parse(data);
  }
}

var jsonSetBlock = {
  "block": {
    "type": "json_set",
    "message0": "set %1 . %2 to %3",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "msg"
      },
      {
        "type": "field_input",
        "name": "PROP",
        "text": "default"
      },
      {
        "type": "input_value",
        "name": "DATA"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 315,
    "tooltip": "Write object property",
    "helpUrl": ""
  },
  "run": async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var prop = context.getField("PROP");
    var data = await context.getValue("DATA");
    var oldVar = context.getVar(variable);
    if(oldVar === undefined) oldVar = {};
    oldVar[prop] = data;
    log.d(variable + "." + prop + " = " + data + "(" + context.getVar("msg").id + ")");
    context.setVar(variable, oldVar);
  }
}

var jsonSetVarBlock = {
  "block": {
    "type": "json_set_var",
    "message0": "set %1 . %2 to %3",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "var"
      },
      {
        "type": "input_value",
        "name": "PROP",
        "check": "String"
      },
      {
        "type": "input_value",
        "name": "DATA"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 315,
    "tooltip": "Write object property",
    "helpUrl": ""
  },
  "run": async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var prop = (await context.getValue("PROP")).toString();
    var data = await context.getValue("DATA");
    var oldVar = context.getVar(variable);
    if(oldVar === undefined) oldVar = {};
    oldVar[prop] = data;
    log.d(variable + "." + prop + " = " + data + "(" + context.getVar("msg").id + ")");
    context.setVar(variable, oldVar);
  }
}

var jsonContainsKey = {
  block: {
    "type": "json_contains_key",
    "message0": "%1 contains key %2",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "tmp"
      },
      {
        "type": "input_value",
        "name": "PROP",
        "check": "String"
      }
    ],
    "output": null,
    "colour": 315,
    "tooltip": "Returns true if object contains a specific property",
    "helpUrl": ""
  }, 
  run: async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var prop = (await context.getValue("PROP")).toString();
    var oldVar = context.getVar(variable);
    return prop in oldVar;
  }
}

var jsonGetBlock = {
  "block": {
    "type": "json_get",
    "message0": "%1 . %2",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "msg"
      },
      {
        "type": "field_input",
        "name": "PROP",
        "text": "topic"
      }
    ],
    "output": null,
    "colour": 315,
    "tooltip": "Get json property",
    "helpUrl": ""
  },
  "run": async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var prop = context.getField("PROP");
    var oldVar = context.getVar(variable);
    if(oldVar === undefined) return undefined;
    return oldVar[prop];
  }
}

var jsonGetVarBlock = {
  "block": {
    "type": "json_get_var",
    "message0": "%1 . %2",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "tmp"
      },
      {
        "type": "input_value",
        "name": "PROP",
        "check": "String"
      }
    ],
    "output": null,
    "colour": 315,
    "tooltip": "Get json property",
    "helpUrl": ""
  },
  "run": async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var prop = await context.getValue("PROP");
    var oldVar = context.getVar(variable);
    if(oldVar === undefined) return undefined;
    return oldVar[prop];
  }
}

var jsonKeysBlock = {
  "block": {
    "type": "json_keys",
    "message0": "keys of %1",
    "args0": [
      {
        "type": "field_variable",
        "name": "VARIABLE",
        "variable": "tmp"
      }
    ],
    "output": null,
    "colour": 315,
    "tooltip": "Get json property",
    "helpUrl": ""
  },
  "run": async (context) => {
    context.blockIn();
    var variable = context.getField("VARIABLE");
    var oldVar = context.getVar(variable);
    if(typeof(oldVar) == "object")
      return Object.keys(oldVar);
    else
      return [];
  }
}

function getInfo(env) {
  return {
    "id": "json",
    "name": "Json management library",
    "author": "Alfonso Vila"
  }
}

async function getBlocks() {
  return {
    "json": jsonBlock,
    "json_stringify": jsonStringifyBlock,
    "json_stringify_beautify": jsonStringifyBeautifyBlock, 
    "json_parse": jsonParseBlock,
    "json_set": jsonSetBlock,
    "json_set_var": jsonSetVarBlock, 
    "json_get": jsonGetBlock, 
    "json_get_var": jsonGetVarBlock, 
    "json_contains_key": jsonContainsKey, 
    "json_keys": jsonKeysBlock
  };
}

function getServices() {
  return {};
}

function getToolbox() {
  return {
    "default": {
      "Objects": ' \
        <block type="json.json"></block> \
        <block type="json.json_stringify"></block> \
        <block type="json.json_stringify_beautify"></block> \
        <block type="json.json_parse"></block> \
        <block type="json.json_set"></block> \
        <block type="json.json_set_var"></block> \
        <block type="json.json_get"></block> \
        <block type="json.json_get_var"></block> \
        <block type="json.json_contains_key"></block> \
        <block type="json.json_keys"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
