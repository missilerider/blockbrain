'use strict';

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
      //console.dir(context.getProgram());

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
      var json = await context.getValue("JSON");
      return JSON.stringify(json);
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
      //console.dir(context.getProgram());

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
    "tooltip": "Convert to json",
    "helpUrl": ""
  },
  "run": async (context) => {
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
    var variable = context.getField("VARIABLE");
    var prop = context.getField("PROP");
    var oldVar = context.getVar(variable);
    if(oldVar === undefined) return undefined;
    return oldVar[prop];
  }
}

function getInfo(env) {
  return {
    "id": "json",
    "name": "Json management library",
    "author": "Alfonso Vila"
  }
}

function getBlocks() {
  return {
    "json": jsonBlock,
    "json_stringify": jsonStringifyBlock,
    "json_parse": jsonParseBlock,
    "json_set": jsonSetBlock,
    "json_get": jsonGetBlock
  };
}

function getServices() {
  return {};
}

function getToolbox() {
  return {
    "default": {
      "Functions": ' \
        <block type="json.json"></block> \
        <block type="json.json_stringify"></block> \
        <block type="json.json_parse"></block> \
        <block type="json.json_set"></block> \
        <block type="json.json_get"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
