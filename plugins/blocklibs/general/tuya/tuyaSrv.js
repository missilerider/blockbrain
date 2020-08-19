'use strict';

const log = global.log;
const slog = global.slog;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  
var tuyaService = {
    getInfo: () => { return {
      methods: ["start", "stop", "status"],
      name: "Tuya service",
      description: "Tuya cloud integration and device discovery"
  
    }},
    status: () => { return "Running"; },
    start: () => { return true; },
    stop: () => { return true; },
    run: async (srv) => {
      log.d("Tuya service started");
      srv.status = 1;
      console.dir(srv);
  
      while(!srv.stop) {
          // TODO: Discovery repetitivo
        await sleep(1000);
      }
      log.d("Tuya service stopped");
      srv.status = 0;
    }
  }
  
  function getInfo(env) {
    return {
      "id": "tuya",
      "name": "Tuya service",
      "author": "Alfonso Vila"
    }
  }
  
  
  async function getBlocks() {
    return {
/*      "pushStart": pushStartBlock,
      "consoleLog": consoleLogBlock*/
    };
  }
  
  function getServices() {
    return { "tuyaService": tuyaService };
  }
  
  function getToolbox() {
    return {
      "Tuya": {
/*        "Events": '<block type="test.pushStart"></block>',
        "Functions": '<block type="test.consoleLog"></block>'*/
      }
    }
  }
  
  module.exports = {
    getInfo: getInfo,
    getBlocks: getBlocks,
    getServices: getServices,
    getToolbox: getToolbox
  }
  