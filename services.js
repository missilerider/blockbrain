'use strict';

const debug = require('debug')('blockbrain:service');

var plugins = null;
var conf = null;
var services = [];
var utils = null;
var server = null;

var serviceData = {};
var servicePromise = {};

const statusName = {
  0: {
    0: "stopped",
    1: "starting"
  },
  1: {
    0: "stopping",
    1: "running"
  }
}

var commonTools = {};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function config(params) {
  plugins = params.plugins;
  conf = params.config;
  utils = params.utils;
  server = params.server;

  commonTools = {
    utils: utils, 
    executeEvent: async (block, data, params) => {
      let ret = await utils.executeEvent(block, data, params);
      if(ret === null) return null;

      return ret.filter(r => r != null);
    }
  }

  plugins.onReload(onPluginsReload);
}

function onPluginsReload() {
  services = plugins.getServices();
}

function status(srvName, extended = false) {
  if(!(srvName in services)) {
    log.e("Service status " + srvName + " not found");
    return { status: "unknown" };
  }

  if(!(srvName in serviceData)) {
    return { status: "stopped" };
    }

  let ret = { status: statusName[serviceData[srvName].status][serviceData[srvName].desiredStatus]};

  if(extended && services[srvName].getInfo().methods.includes("status")) {
    ret.extended = services[srvName].status();
  }

  return ret;
}

async function start(srvName, callbackFinish) {
  debug(`Start service ${srvName}`);
  if(!(srvName in services)) {
    log.e("Service start " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData)) {
    debug(`Set initial '${srvName}' service status data`)
    serviceData[srvName] = {
      stop: true,
      status: 0,
      desiredStatus: 0, 
      config: null
    }
  }

  if(!('start' in services[srvName])) {
    log.e(`Service ${srvName} does not contain 'start'`);
    debug(Object.keys(services[srvName]));
    return false;
  }

  if('html' in services[srvName].getInfo() && 'htmlCallback' in services[srvName]) {
    // Associate HTML server endpoints
    let methods = services[srvName].getInfo().html;
    if('get' in methods) {
      for(const mg of Object.keys(methods.get)) {
        debug(`Associates server GET path /srv/${srvName}/${mg}`);
        server.app.get(`/srv/${srvName}/${mg}`, methods.get[mg]);
      }
    }

    if('post' in methods) {
      for(const mp of Object.keys(methods.post)) {
        debug(`Associates server POST path /srv/${srvName}/${mp}`);
        server.app.post(`/srv/${srvName}/${mp}`, methods.post[mp]);
      }
    }
  }

  // Reload config when service starts
  let ops = services[srvName].getInfo().options;
  if(ops && Array.isArray(ops) && ops.includes("noConfig")) {
    debug(`Service ${srvName} does not use configuration file`);

    serviceData[srvName].config = {};

  } else {
    serviceData[srvName].config = utils.loadServiceConfig(srvName);
  }

  serviceData[srvName].stop = false;
  serviceData[srvName].desiredStatus = 1;

  debug(`start ${srvName}`);
  if('start' in services[srvName]) {
    services[srvName].start(serviceData[srvName], commonTools);
  }

  servicePromise[srvName] = services[srvName].run(serviceData[srvName], commonTools).then(() => {
    delete servicePromise[srvName];
    serviceData[srvName].stop = true;
    serviceData[srvName].status = 0;
    serviceData[srvName].desiredStatus = 0;

    if(callbackFinish)
      callbackFinish();
  }).catch((err) => {
    log.e(`Service '${srvName}' stopped on startup with an error (${err}). Service will not run!`);
    debug(err.stack);
    delete servicePromise[srvName];
    serviceData[srvName].stop = true;
    serviceData[srvName].status = 0;
    serviceData[srvName].desiredStatus = 0;
  });
}

async function stop(srvName, callbackFinish) {
  if(!(srvName in services)) {
    log.e("Service stop " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData && srvName in servicePromise)) {
    log.e("Service stop " + srvName + " not started");
    return;
  }

  serviceData[srvName].stop = true;
  serviceData[srvName].desiredStatus = 0;

  if('stop' in services[srvName]) {
    services[srvName].stop(serviceData[srvName], commonTools);
  }

  if(callbackFinish) {
    servicePromise[srvName].then(callbackFinish);
  }
}

async function waitForStatusSync(srvName, status, maxMillis, callback) {
  if(!(srvName in services)) {
    log.e("Service wait " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData && srvName in servicePromise)) {
    log.e("Service wait " + srvName + " not started");
  }

  // Dirty solution!
  let start = new Date();
  while(services[srvName].status != status && (new Date() - start) < maxMillis) {
    await sleep(50);
  }

  if(callback)
    callback(serviceData[srvName].status, status);

  return serviceData[srvName].status == status;
}

function setStartOnBoot(srvName, start) {
  conf.startupServices[srvName] = start;
  utils.saveStartupServices(conf.startupServices);
}

function settingsTemplate(srvName) {
  if(!(srvName in services)) {
    log.e("Service start " + srvName + " not found");
    return;
  }

  if('settingsTemplate' in services[srvName]) {
    return services[srvName].settingsTemplate(serviceData[srvName], commonTools);
  } else {
    log.f(`Service ${srvName} does not contain 'settingsTemplate' as it should!`);
    return {};
  }
}

function applySettings(srvName, params) {
  if(!(srvName in services)) {
    log.e("Service start " + srvName + " not found");
    return;
  }

  if('applySettings' in services[srvName]) {
    return services[srvName].applySettings(params, commonTools);
  } else {
    log.f(`Service ${srvName} does not contain 'applySettings' as it should!`);
    return {};
  }
}

function onSaveScript(file, blocks) {
  debug('onSaveScript ' + file);
  Object.keys(services).forEach((sId) => {
    if(services[sId].getInfo().methods.includes('onSave') && ('onSave' in services[sId])) { // Service accepts onSave event?
      let srvPrefix = sId + ".";
      let b = [];
      for(let n = 0; n < blocks.length; n++) {
        if(blocks[n]._attributes.type.startsWith(srvPrefix)) {
          b.push(blocks[n]);
        }
      }

      if(b.length > 0) {
        debug(`onSave for service ${sId} and file ${file} (${b.length} blocks)`);
        services[sId].onSave(file, {
          blocks: b
        });
      }
  }
  });

}

module.exports = {
  config: config,
  start: start,
  stop: stop,
  status: status,
  waitForStatusSync: waitForStatusSync,
  getServices: () => { return services; },
  setStartOnBoot: setStartOnBoot, 
  settingsTemplate: settingsTemplate, 
  applySettings: applySettings, 
  onSaveScript: onSaveScript
}
