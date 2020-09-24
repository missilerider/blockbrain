'use strict';

const SERVICE_NAME = "snmp";

const blocks = require('./snmp.blocks.lib.js');
const code = require('./snmp.code.lib.js');

const lib = require('./snmp.lib.js');

const debug = require('debug')('blockbrain:service:snmp');
const log = global.log;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var tools = null;
var utils = null;
var hosts = {};

function hostsCombo(base, all = false) {
  let ret = { ... base };
  let hostsIds = Object.keys(hosts);

  hostsIds = hostsIds.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));

  let combo = [];

  if(all) {
    combo.push([ "<all hosts>", "___ALL___" ]);
  }

  for(let n = 0; n < hostsIds.length; n++) {
      combo.push([ hostsIds[n], hostsIds[n] ]);
  }

  ret.args0[0].options = combo;
  if(ret.args0[0].options.length == 0)
      ret.args0[0].options = [[ "<no things>", "___NONE___" ]];

  return ret;
}

function entitiyChannelsCombo(base, all = false) {
  let ret = { ... base };
  let things = oh.getThings();
  let labels = [];
  let itemsByLabel = {};
  let thingIds = Object.keys(things);

  for(let n = 0; n < thingIds.length; n++) {
    let chs = things[thingIds[n]].channels;
    let chIds = Object.keys(chs);

    for(let m = 0; m < chIds.length; m++) {
      let label = things[thingIds[n]].label + "/" + chs[chIds[m]].label;

      itemsByLabel[label] = chs[chIds[m]].uid;
      labels.push(label);
    }
  }

  labels = labels.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));

  if(all) {
    itemsByLabel["<any thing/channel>"] = "___ALL___";
    labels.unshift("<any thing/channel>");
  }

  let combo = [];

  for(let n = 0; n < labels.length; n++) {
      combo.push([ labels[n], itemsByLabel[labels[n]]]);
  }
  ret.args0[0].options = combo;
  if(ret.args0[0].options.length == 0)
      ret.args0[0].options = [[ "<no things/channels>", "___NONE___" ]];

  return ret;
}

async function getBlocks() {
  return {
    // Query
    "readOid": { 
      block: (services) => { return hostsCombo(blocks.readOid, false); }, 
      run: code.readOid
    }, 
    "walkOid": {
      block: () => { return hostsCombo(blocks.walkOid, false); }, 
      run: code.walkOid
    }
  };
}

function getToolbox() {
  return {
    "snmp": {
      "Query": ' \
        <block type="snmp.readOid"></block> \
        <block type="snmp.walkOid"></block> \
      ', 
      "System": ' \
        ', 
      "Network": ' \
        ', 
      "Meraki": ' \
        '
    }

  }
}

var service = {
  getInfo: () => { return {
    methods: ["start", "stop"],
    name: module.exports.getInfo().name,
    description: "Simple Network Management Protocol"
  }},
  status: () => { return "TODO"; },
  start: (srv, srvTools) => {
    tools = srvTools;
    utils = tools.utils;
    hosts = utils.loadServiceAdditionalConfig(SERVICE_NAME, "hosts");
    debug("Hosts loaded");
    return true;
  },
  stop: async (srv) => {
    if(!runPromise || !runPromiseResolve) return false;
    runPromiseResolve();
    runPromise = null;
    runPromiseResolve = null;
  },
  run: async (srv, srvTools) => {
    tools = srvTools;

    if(runPromise || runPromiseResolve) return false; // Must stop before
    runPromise = new Promise(resolve => {
      runPromiseResolve = resolve;
    });

    code.config({
      hosts: hosts, 
    });

    /* TODO: Listen SNMP traps ******************************
    if(!await oh.start()) {
      log.e('Openhab2 service cannot subscribe to event bus');
    } else {
      debug(`Event bus subscription to host ${host} correct and running`);
    }
    */

    srv.status = 1;
  
    debug("snmp startup complete");

    await runPromise;

    debug('snmp stop');

    oh.stop(); // Stops thing updates and everything
   
    //clearInterval(intervalHandler);

    srv.status = 0;
    debug("snmp service completely stopped");
  }
}

module.exports = {
  getInfo: () => { return {
      id: "snmp",
      name: "SNMP",
      author: "Alfonso Vila"
    } }, 
  getBlocks: getBlocks,
  getServices: () => { return { "snmp": service } },
  getToolbox: getToolbox
}
