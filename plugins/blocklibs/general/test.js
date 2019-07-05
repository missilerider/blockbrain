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
    "toolbox": "default",
    "type": "event",
    "category": "test",
    "definition": "def1"
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
    "toolbox": "default",
    "type": "function",
    "category": "test",
    "definition": "def2"
  }
};

function getBlocks() {
  return {
    "pushStart": pushStartBlock,
    "consoleLog": consoleLogBlock
  };
}

function getServices() {
  return {};
}

function getToolbox() {
  return {
    "default": {
      "events": '<block type="test.pushStart"></block>',
      "functions": '<block type="test.consoleLog"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
