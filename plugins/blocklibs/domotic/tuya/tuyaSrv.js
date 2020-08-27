'use strict';

const TuyaDevice = require('tuyapi');
const blocks = require('./tuyaBlocks.lib.js');
//const utils = require('tuyapi/lib/utils');

const debug = require('debug')('blockbrain:service:tuya');
const log = global.log;

var utils = null;
var serviceConfig = {};

var devices = {};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var discoveryBlock = {
  "block": blocks.discovery, 
  "run": async (context) => {
    return performDiscovery();
  }
}

// MOST OF THE DISCOVERY CODE HAS BEEN TAKEN FROM NJSTUYA, A TUYAPI WRRAPPER
function performDiscovery() {
  let tuya = new TuyaDevice({
    id: '00000000000000000000',
    key: '1000000000000000',
    ip: '',
    resolve: '',
    version: undefined,
  });

  return new Promise((resolve, reject) => {
    //const devices = [];
    debug("Starting Tuya device discovery...");
    tuya.find({ timeout: 8, all: true }).then(async () => {
      debug(`devices ${JSON.stringify(tuya.foundDevices)}`);
      debug(tuya.foundDevices);
      let newDevices = [];

      for(const{ id, ip } of tuya.foundDevices) {
        if(ip) {
          // eslint-disable-next-line no-await-in-loop
          //await getSchema(ip, id).then(device => devices.push(device)).catch(error => debug(error));
          newDevices.push({ "id": id, "ip": ip });
        }
      }
      debug(`Updated Devices ${JSON.stringify(tuya.foundDevices)}`);
      let newDevs = false;
      debug("devs actuales");
      debug(devices);
      for(let n = 0; n < newDevices.length; n++) {
        debug(`check ${newDevices[n].id}`)
        if(!(newDevices[n].id in devices)) {
          debug(`New Tuya device found ${newDevices[n].id}`);
          log.i(`New Tuya device found ${newDevices[n].id}`);
          devices[newDevices[n].id] = {
            type: "unknown", 
            name: newDevices[n].id
          };
          newDevs = true;
        }
      }
      resolve(newDevices);
      if(newDevs)
        saveDevs();
    }, (reason) => {
      reject(reason.toString());
    }).catch(error => debug(error));
  });
}

/*
async function getSchema(ip, id, key = '1000000000000000', version = '') {
  return new Promise((resolve, reject) => {
    let deviceData = {};
    const newTuya = new TuyaDevice({
      id,
      ip,
      key,
      version,
    });
    setTimeout(() => {
      debug('Timeout');
      newTuya.disconnect();
      reject(new Error('Timeout getting schema'));
    }, 5000);
    newTuya.on('disconnected', () => {
      debug('Disconnected from device.');
    });
    newTuya.on('error', (error) => {
      debug('Error', error);
      newTuya.disconnect();
      reject(error);
    });
    newTuya.on('connected', () => {
      debug('Connected to device!');
    });
    newTuya.on('data', (schema) => {
      debug(`${id}: ${JSON.stringify(schema)}`);
      try {
        newTuya.disconnect();
        const broadcast = {};
        Object.keys(newTuya.device).forEach((dkey) => {
          if(dkey !== 'parser' && dkey !== 'key') broadcast[dkey] = newTuya.device[dkey];
        });
        deviceData = {id, broadcast, schema};
        print(JSON.stringify(deviceData));
        Object.keys(schema).forEach(attname => debug(`${attname}: ${JSON.stringify(schema[attname])}`));
        resolve(deviceData);
      } catch(error) {
        debug(error);
      }
    });
    newTuya.connect();
  });
}
*/

function loadDevs() {
  devices = utils.loadServiceAdditionalConfig("tuya", "devices");
  if(devices === null) {
    log.e("Could not load devices JSON file! Assuming empty device list and disabling auto-discovery (that would overwrite existing file!");
    serviceConfig.autoDiscovery.enable = false;
    devices = {};
  }
}

function saveDevs() {
  utils.saveServiceAdditionalConfig("tuya", "devices", devices);
}

var tuyaService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status", "settings"],
    name: "Tuya service",
    description: "Tuya cloud integration and device discovery"

  }},
  status: () => { return "Running"; },
  start: (srv, tools) => {
    serviceConfig = Object.assign(blocks.defaultConfig, srv.config);
    utils = tools.utils;
    loadDevs();
    return true;
  },
  stop: () => { return true; },
  run: async (srv) => {
    debug("Tuya service started");
    srv.status = 1;
    debug(JSON.stringify(srv));

    while(!srv.stop) {
        // TODO: Discovery repetitivo
      await sleep(1000);
    }
    debug("Tuya service stopped");
    srv.status = 0;
  }, 
  settingsTemplate: (srv, tools) => {
    debug('settingsTemplate');
    debug(srv);
  }

}

async function getBlocks() {
  return {
    "discovery": discoveryBlock
/*      "pushStart": pushStartBlock,
    "consoleLog": consoleLogBlock*/
  };
}

function getToolbox() {
  return {
    "Tuya": {
      "Tools": '<block type="tuya.discovery"></block>'
//        "Functions": '<block type="test.consoleLog"></block>'*/
    }
  }
}

module.exports = {
  getInfo: () => { return {
    "id": "tuya",
    "name": "Tuya service",
    "author": "Alfonso Vila"
  } },
  getBlocks: getBlocks,
  getServices: () => { return { "tuyaService": tuyaService } },
  getToolbox: getToolbox
}
