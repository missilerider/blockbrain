const fs = require('fs');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getInfo(env) {
  return {
    "id": "telegram",
    "name": "Telegram Service Library",
    "author": "Alfonso Vila"
  }
}

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
    let key = context.getField('KEY');
    console.dir(data);
//    let value = await context.getValue('VALUE');
    if(key in data) return data[key];
    else {
      return null;
    }
  }
};

var telegramService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status"],
    name: "Telegram Service",
    description: "Integrates with Telegram as a bot account"

  }},
  status: () => { return "TODO"; },
  start: (srv) => {
    serviceConfig = srv.config;

    // Preloads keys and values if necesary
    if(serviceConfig.persistence) {
      log.d("Loads saved keys");
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

    while(!srv.stop) {
      console.log("Servicio vivo!");
      await sleep(1000);
    }

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

function loadKeys(config) {
  fs.readFile(config.vaultFile, (err, newData) => {
    if(err) {
      log.w("Could not read key-value vault file. Starting from scratch!");
    } else {
      try {
        data = JSON.parse(newData);
      } catch {
        log.e("Loaded data from key-value vault not readable. Disabling persistence!");
        config.persistence = false;
        log.i("If you want to make persistence work again, please delete the vault file or fix the JSON structure in it manually");
      }
    }
  });
}

function saveKeys() {
  log.d("Persists key-value data to file " + serviceConfig.vaultFile);
  try {
    fs.writeFileSync(serviceConfig.vaultFile, JSON.stringify(data), 'utf8');
  } catch {
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
