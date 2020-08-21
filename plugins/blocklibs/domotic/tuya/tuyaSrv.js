'use strict';

const debug = require('debug')('blockbrain:service:tuya');
const log = global.log;

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
      debug("Tuya service started");
      srv.status = 1;
      debug(JSON.stringify(srv));
  
      while(!srv.stop) {
          // TODO: Discovery repetitivo
        await sleep(1000);
      }
      debug("Tuya service stopped");
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
  