'use strict';

const SERVICE_NAME = "tuya";

const TuyaDevice = require('tuyapi');
const blocks = require('./tuyaBlocks.lib.js');
//const utils = require('tuyapi/lib/utils');

const debug = require('debug')('blockbrain:service:tuya');
const log = global.log;

var utils = null;
var serviceConfig = {};
var handlerAutoDiscovery = null;

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

function loadDevs() {
  devices = utils.loadServiceAdditionalConfig(SERVICE_NAME, "devices");
  if(devices === null) {
    log.e("Could not load devices JSON file! Assuming empty device list and disabling auto-discovery (that would overwrite existing file!");
    serviceConfig.autoDiscovery.enabled = false;
    devices = {};
  }
}

function saveDevs() {
  utils.saveServiceAdditionalConfig(SERVICE_NAME, "devices", devices);
}

var tuyaService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status", "settings"],
    name: "Tuya connector service",
    description: "Tuya cloud integration and device discovery"

  }},
  status: () => { return "Running"; },
  start: (srv, tools) => {
    debug("config:");
    debug(srv);
    debug(blocks.defaultConfig);
    serviceConfig = Object.assign(blocks.defaultConfig, srv.config);
    debug(serviceConfig);
    debug(Object.assign(srv.config, blocks.defaultConfig));
    utils = tools.utils;
    loadDevs();
    return true;
  },
  stop: () => { return true; },
  run: async (srv) => {
    debug("Tuya service started");
    srv.status = 1;
    debug(JSON.stringify(srv));

    if(serviceConfig.autoDiscovery.enabled) {
      debug(`Initiating auto discovery every ${serviceConfig.autoDiscovery.interval} secs`)
      handlerAutoDiscovery = setInterval(performDiscovery, serviceConfig.autoDiscovery.interval * 1000);
    }

    while(!srv.stop) {
        // TODO: Discovery repetitivo
      await sleep(1000);
    }

    if(handlerAutoDiscovery != null)
      clearInterval(handlerAutoDiscovery);

    debug("Tuya service stopped");
    srv.status = 0;
  }, 
  settingsTemplate: (srv, tools) => {
    debug('settingsTemplate');
    let ret = {
      "form": blocks.serviceSettingsForm, 
      "default": {
        "email": serviceConfig.email, 
        "password": serviceConfig.password, 
        "countryCode": serviceConfig.countryCode, 
        "bizType": serviceConfig.bizType, 
        "region": serviceConfig.region, 

        "autoDiscovery": serviceConfig.autoDiscovery.enabled, 
        "autoDiscoveryInterval": serviceConfig.autoDiscovery.interval, 
      }
    };

    let ids = Object.keys(devices);
    for(let n = 0; n < ids.length; n++) {
      let dev = devices[ids[n]];
      ret.form.push({
        "name": `deviceName.${dev}`,
        "desc": `Device ID ${ids[n]} name`,
        "type": "text",
        "width": 3
      });
      ret.default[`deviceName.${dev}`] = dev.name;
      ret.form.push({
        "name": `deviceType.${dev}`,
        "desc": `Device ID ${ids[n]} type`,
        "type": "text",
        "width": 3
      });
      ret.default[`deviceType.${dev}`] = dev.type;
    }

    return ret;
  }, 
  applySettings: (params, commonTools) => {
    debug("Apply settings");
    if("autoDiscovery" in params) serviceConfig.autoDiscovery.enabled = params.autoDiscovery;
    if("autoDiscoveryInterval" in params) serviceConfig.autoDiscovery.interval = params.autoDiscoveryInterval;

    if("email" in params) serviceConfig.email = params.email;
    if("password" in params) serviceConfig.password = params.password;
    if("countryCode" in params) serviceConfig.countryCode = params.countryCode;
    if("bizType" in params) serviceConfig.bizType = params.bizType;
    if("region" in params) serviceConfig.region = params.region;

    debug(params);
    debug("Config final");
    debug(serviceConfig);

    if(("autoDiscovery" in params) || ("autoDiscoveryInterval" in params)) {
      if(handlerAutoDiscovery != null)
        clearInterval(handlerAutoDiscovery);

      handlerAutoDiscovery = null;

      if(serviceConfig.autoDiscovery.enabled)
        handlerAutoDiscovery = setInterval(performDiscovery, serviceConfig.autoDiscovery.interval * 1000);
    }

    saveConfig();

    debug("Apply settings!!");
    debug(params);

    return { result: "OK" };//, action: "Service must be restarted manually" }
  }
}

function saveConfig() {
  debug("Save config");
  utils.saveServiceConfig(SERVICE_NAME, serviceConfig);
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
    "id": SERVICE_NAME,
    "name": "Tuya service",
    "author": "Alfonso Vila"
  } },
  getBlocks: getBlocks,
  getServices: () => { return { tuya: tuyaService } },
  getToolbox: getToolbox
}
