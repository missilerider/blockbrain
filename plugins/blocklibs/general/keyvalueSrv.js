const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var data = {};

function getInfo(env) {
  return {
    "id": "kv",
    "name": "Key-Value Service Library",
    "author": "Alfonso Vila"
  }
}

var writeKeyBlock = {
  "block": {
    "type": "writekey",
    "message0": "set key %1 to %2",
    "args0": [
      {
        "type": "field_input",
        "name": "KEY",
        "text": "keyName"
      },
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Sets a key value",
    "helpUrl": ""
  },
  "toolbox": {
    "toolbox": "default",
    "type": "function",
    "category": "keyvalue",
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
    let key = context.getField(context, 'KEY');
    let value = await context.getValue(context, 'VALUE');
    data[key] = value;
    console.log("Key set: " + key + " = " + value);
  }
};

var readKeyBlock = {
  "block": {
    "type": "readkey",
    "message0": "key %1",
    "args0": [
      {
        "type": "field_input",
        "name": "KEY",
        "text": "keyName"
      }
    ],
    "output": null,
    "colour": 120,
    "tooltip": "",
    "helpUrl": ""
  },
  "toolbox": {
    "toolbox": "default",
    "type": "function",
    "category": "keyvalue",
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
    let key = context.getField(context, 'KEY');
    console.dir(data);
//    let value = await context.getValue(context, 'VALUE');
    if(key in data) return data[key];
    else {
      return null;
    }
  }
};

var keyValueService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status"],
    name: "Key-Value Service",
    description: "Stores and manages key-value pairs"

  }},
  status: () => { return "TODO"; },
  start: (srv) => {
    console.dir(srv.config);

    // Preloads keys and values if necesary
    if(srv.config.persistency) {
      log.d("PERSISTENCY");
    }

    return true;
  },
  stop: (srv) => {
    if(!runPromise || !runPromiseResolve) return false;
    runPromiseResolve();
    runPromise = null;
    runPromiseResolve = null;
  },
  run: async (srv) => {
    srv.status = 1;
    if(runPromise || runPromiseResolve) return false; // Must stop before
    runPromise = new Promise(resolve => {
      runPromiseResolve = resolve;
    });

    await runPromise;

    srv.status = 0;
  }
}

function getBlocks() {
  return {
    "writeKey": writeKeyBlock,
    "readKey": readKeyBlock
  };
}

function getServices() {
  return { "keyValue": keyValueService };
}

function getToolbox() {
  return {
    "default": {
      "Functions": '<block type="kv.writeKey"></block> \
                    <block type="kv.readKey"></block>'
//      "Functions": '<block type="test.consoleLog"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
