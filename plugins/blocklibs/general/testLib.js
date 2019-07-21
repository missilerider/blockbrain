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
    "toolbox": "default",
    "type": "event",
    "category": "test",
    "definition": "def1"
  },
  "run": async (context) => {
    console.log("Ejecucion de pushStart");
    console.dir(context.getMsg());
    return await context.continue(context, "CMD");
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
  },
  "run": async (context) => {
    console.log("consoleLog: " + await context.getParam(context, 'TXT'));
  }
};

var testService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status"],
    name: "Test service",
    description: "Test service for testing API and integration mechanisms"

  }},
  status: () => { return 0; },
  start: () => { return true; },
  stop: () => { return true; },
  run: async (srv) => {
    log.d("Starting...");
    await sleep(1000);
    srv.status = 1;
    log.d("Started");
    console.dir(srv);

    while(!srv.stop) {
      console.log("Servicio vivo!");
      await sleep(1000);
    }
    log.d("Stopping");
    await sleep(2000);
    log.d("Stopped");
    srv.status = 0;
  }
}

function getBlocks() {
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
    "default": {
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
