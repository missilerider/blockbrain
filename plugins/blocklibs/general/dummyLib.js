'use strict';

const debug = require('debug')('blockbrain:service:dummy');
const sdebug = require('debug')('blockbrain:script:dummy');
const slog = global.slog;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getInfo(env) {
  return {
    "id": "test",
    "name": "Libreria de pruebas",
    "author": "Alfonso Vila"
  }
}

var pushStartBlock = {
  "block": {
    "type": "pushstart",
    "message0": "dummy start %1 %2",
    "args0": [
      {
        "type": "input_dummy"
      },
      {
        "type": "input_statement",
        "name": "CMD"
      }
    ],
    "colour": 195,
    "tooltip": "Dummy call for testing",
    "helpUrl": ""
  },
  "toolbox": {
    "toolbox": "dummy",
    "type": "event",
    "category": "test",
    "definition": "def1"
  },
  "properties": {
    "form": [
      {
        "name": "test",
        "desc": "Test",
        "type": "text",
        "width": 12
      },
      {
        "type": "textarea",
        "name": "multiline",
        "desc": "Super texto",
        "width": 12,
        "rows": 4,
      }
    ],
    "default": {
      "test": "Texto de test por defecto"
    }
  },
  "run": async (context) => {
    context.blockIn();
    sdebug(context.getMsg());
    return await context.continue("CMD");
  }
};

var consoleLogBlock = {
  "block": async function() {
    return {
      "type": "log",
      "message0": "log %1",
      "args0": [
        {
          "type": "input_value",
          "name": "TXT",
          "check": [
            "String",
            "json"
          ]
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 195,
      "tooltip": "Outputs text to console",
      "helpUrl": ""
    };
  },
  "toolbox": {
    "toolbox": "dummy",
    "type": "function",
    "category": "test",
    "definition": "def2"
  },
  "run": async (context) => {
    context.blockIn();
    sdebug("consoleLog: " + await context.getParam('TXT'));
  }
};

var testService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status"],
    name: "Test service",
    description: "Test service for testing API and integration mechanisms"

  }},
  status: () => { return "Logging on console"; },
  start: () => { return true; },
  stop: () => { return true; },
  run: async (srv) => {
    debug("Starting...");
    await sleep(1000);
    srv.status = 1;
    debug("Started");
    debug(JSON.stringify(srv));

    while(!srv.stop) {
      debug("Servicio vivo!");
      await sleep(1000);
    }
    debug("Stopping");
    await sleep(2000);
    debug("Stopped");
    srv.status = 0;
  }
}

async function getBlocks() {
  return {
    "pushStart": pushStartBlock,
    "consoleLog": consoleLogBlock
  };
}

function getServices() {
  return { "testService": testService };
}

function getToolbox() {
  return {
    "dummy": {
      "Events": '<block type="test.pushStart"></block>',
      "Functions": '<block type="test.consoleLog"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
