'use strict';

var plugins = null;
var conf = null;
var services = [];

var serviceData = {};
var servicePromise = {};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function config(params) {
  plugins = params.plugins,
  conf = params.config

  plugins.onReload(onPluginsReload);
}

function onPluginsReload() {
  services = plugins.getServices();
}

function status(srvName) {
  return 123;
}

async function start(srvName, callbackFinish) {
  if(!(srvName in services)) {
    log.e("Service " + srvName + " not found");
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
    log.e("Service " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData && srvName in servicePromise)) {
    log.e("Service " + srvName + " not started");
  }

  serviceData[srvName].stop = true;
  serviceData[srvName].desiredStatus = 0;
  if(callbackFinish) {
    servicePromise[srvName].then(callbackFinish);
  }
}

async function waitForStatusSync(srvName, status, maxMillis, callback) {
  if(!(srvName in services)) {
    log.e("Service " + srvName + " not found");
    return;
  }

  if(!(srvName in serviceData && srvName in servicePromise)) {
    log.e("Service " + srvName + " not started");
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

module.exports = {
  config: config,
  start: start,
  stop: stop,
  status: status,
  waitForStatusSync: waitForStatusSync
}
