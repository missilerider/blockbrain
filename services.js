'use strict';

var plugins = null;
var conf = null;
var services = [];
var utils = null;

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

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function config(params) {
  plugins = params.plugins;
  conf = params.config;
  utils = params.utils;

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
  if(!(srvName in services)) {
    log.e("Service start " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData)) {
    serviceData[srvName] = {
      stop: true,
      status: 0,
      desiredStatus: 0
    }
  }

  if(serviceData[srvName] == 1) return false;

  serviceData[srvName].stop = false;
  serviceData[srvName].desiredStatus = 1;
  servicePromise[srvName] = services[srvName].run(serviceData[srvName]).then(() => {
    delete servicePromise[srvName];
    serviceData[srvName].stop = true;
    serviceData[srvName].status = 0;
    serviceData[srvName].desiredStatus = 0;

    if(callbackFinish)
      callbackFinish();
  });
}

async function stop(srvName, callbackFinish) {
  if(!(srvName in services)) {
    log.e("Service stop " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData && srvName in servicePromise)) {
    log.e("Service stop " + srvName + " not started");
  }

  serviceData[srvName].stop = true;
  serviceData[srvName].desiredStatus = 0;
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
  if(!(srvName in conf.startupServices)) return false;
  conf.startupServices[srvName] = start;
  utils.saveStartupServices(conf.startupServices);
}

module.exports = {
  config: config,
  start: start,
  stop: stop,
  status: status,
  waitForStatusSync: waitForStatusSync,
  getServices: () => { return services; },
  setStartOnBoot: setStartOnBoot
}
