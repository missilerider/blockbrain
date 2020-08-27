const fs = require('fs');
const debug = require('debug')('blockbrain:service:keyvalue');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var utils = null; // Set at "start" from service "commonTools"

var data = {};
var serviceConfig = null;
var waitingSave = false;

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
    "message0": "store key %1 to %2",
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
    "tooltip": "Sets a key value for permanent storage",
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
    context.blockIn();
    let key = context.getField('KEY');
    let value = await context.getValue('VALUE');
    data[key] = value;
    debug("Key set: " + key + " = " + value);
    if(serviceConfig.persistence) {
      debug("Starts delayed key persistence...");
      waitingSave = true;
      setTimeout(saveKeys, serviceConfig.saveDelay);
    }

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
    context.blockIn();
    let key = context.getField('KEY');
    if(key in data) {
      if(data[key])
        return data[key].getValue();
      else return data[key];
    }
    else {
      return null;
    }
  }
};

var keyValueService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status", "settings"],
    name: "Key-Value Service",
    description: "Stores and manages key-value pairs"
  }},
  status: () => { return "TODO"; },
  start: (srv, tools) => {
    serviceConfig = srv.config;
    utils = tools.utils;

    // Preloads keys and values if necesary
    if(serviceConfig.persistence) {
      loadKeys(serviceConfig);
    }

    return true;
  },
  stop: (srv) => {
    serviceConfig = srv.config;
    if(!runPromise || !runPromiseResolve) return false;
    runPromiseResolve();
    runPromise = null;
    runPromiseResolve = null;
  },
  run: async (srv) => {
    serviceConfig = srv.config;
    srv.status = 1;
    if(runPromise || runPromiseResolve) return false; // Must stop before
    runPromise = new Promise(resolve => {
      runPromiseResolve = resolve;
    });

    await runPromise;

    srv.status = 0;
  }, 
  settingsTemplate: (srv) => {

  }
}

async function getBlocks() {
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

function loadKeys(config) {
  debug(`Load vault file "keyValue.${config.vaultFile}.json"`);
  data = utils.loadServiceAdditionalConfig("keyValue", config.vaultFile);

  if(data === null) {
    log.e("Loaded data from key-value vault not readable. Disabling persistence!");
    config.persistence = false;
    log.w("If you want to make persistence work again, please delete the vault file or fix the JSON structure in it manually");
    data = {};
  }

/*  fs.readFile(config.vaultFile, (err, newData) => {
    if(err) {
      log.w("Could not read key-value vault file. Starting from scratch!");
    } else {
      try {
        data = JSON.parse(newData);
      } catch(e) {
        log.e("Loaded data from key-value vault not readable. Disabling persistence!");
        config.persistence = false;
        log.w("If you want to make persistence work again, please delete the vault file or fix the JSON structure in it manually");
      }
    }
  });*/
}

function saveKeys() {
  debug(`Persists key-value data to file "keyValue.${serviceConfig.vaultFile}.json"`);
  if(!utils.saveServiceAdditionalConfig("keyValue", serviceConfig.vaultFile, data)) {
    log.e("Could not save key-value data to file. Disabling persistence");
    serviceConfig.persistence = false;
  }
  waitingSave = false;
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
