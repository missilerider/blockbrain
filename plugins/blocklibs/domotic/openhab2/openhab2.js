'use strict';

const ha = require('./openhab2.lib.js');
const blocks = require('./openhab2.blocks.lib.js');

const debug = require('debug')('blockbrain:service:openhab2');
const log = global.log;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var tools = null;

function getInfo(env) {
  return {
    "id": "homeAssistant",
    "name": "Home Assistant API integration",
    "author": "Alfonso Vila"
  }
}

async function getBlocks() {
  var blocks = {
    "onChange": onChangeBlock,
    "setState": setStateBlock, 
    "setAttributes": setAttributesBlock, 
    "getState": getStateBlock, 
    "getAttributes": getAttributesBlock
  };

  return blocks;
}

function entitiesCombo(base) {
  let ret = { ... base };
  let things = ha.getEntities();
  let thingIds = Object.keys(things).sort();
  let combo = [];
  for(let n = 0; n < thingIds.length; n++) {
      combo.push([ thingIds[n], thingIds[n] ]);
  }
  ret.args0[0].options = combo;
  if(ret.args0[0].options.length == 0)
      ret.args0[0].options = [[
          "<no entities>",
          "___NONE___"
      ]];

  return ret;
}

var onChangeBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.onChange);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var oldState = context.getField('OLDSTATE');
    var newState = context.getField('NEWSTATE');

    if(entity == context.params.entity) {
      context.setVar(newState, context.params.state);
      context.setVar(oldState, context.params.oldState);

      context.continue('CMD');
    }
  }
}

var setStateBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.setState);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var newState = await context.getValue('NEWSTATE');

    ha.setState(entity, newState);
  }
}

var setAttributesBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.setAttributes);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var newState = await context.getValue('NEWSTATE');
    var newAttr = await context.getValue('NEWATTR');

    ha.setState(entity, errornewState, newAttr);
  }
}

var getStateBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.getState);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var entities = ha.getEntities();

    if(entity in entities) return entities[entity].state;
    log.e(`Home Assistant entity ${entity} not found!`);
    return "";
  }
}

var getAttributesBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.getAttributes);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var entities = ha.getEntities();

    if(entity in entities) return entities[entity].attributes;
    log.e(`Home Assistant entity ${entity} not found!`);
    return "";
  }
}

function getToolbox() {
  return {
    "home assistant": {
      "Sensor": '', 
      "Switch": '',
      "General": ' \
        <block type="homeAssistant.onChange"></block> \
        <block type="homeAssistant.setState"></block> \
        <block type="homeAssistant.setAttributes"></block> \
        <block type="homeAssistant.getState"></block> \
        <block type="homeAssistant.getAttributes"></block>'
    }
  }
}

var haService = {
  getInfo: () => { return {
    methods: ["start", "stop"],
    name: "Home Assistant API integration",
    description: "Connects directly to a Home Assistant instance and exposes events and things"
  }},
  status: () => { return "TODO"; },
  start: (srv) => {
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

    let haHost = srv.config.secure ? "https://" : "http://";
    haHost += srv.config.host;
    haHost += srv.config.port ? ":" + srv.config.port : ":8123";

    let apiToken = srv.config.apiToken;

    if(!haHost || !apiToken) {
      log.f("homeAssistant.json host and apiToken fields must be defined at least for Home Assistant integration");
      srv.status = 0;
      return;
    }

    ha.config({
      host: haHost, 
      apiToken: apiToken, 
      thingChanged: thingChanged
    });

    debug("Checking connection to Home Assistant instance " + srv.config.host);

    if(!await ha.ping()) {
      srv.status = 0;
      log.e("Home Assistant connection error. Please check configuration and connectivity");
      debug("Home Assistant API service stopped");
      return;
    }

    srv.status = 1;
  
    debug("Home Assistant connection correct!");

    var intervalHandler = setInterval(async () => {
      ha.tick(ha);
    }, 2000);

    await runPromise;

    clearInterval(intervalHandler);

    srv.status = 0;
    debug("Home Assistant API service stopped");
  }
}

async function thingChanged(entity, state, oldState) {
  debug(`HA ${entity}: ${oldState} => ${state}`);
  tools.executeEvent('homeAssistant.onChange', { entity: entity }, {
    entity: entity,
    oldState: oldState, 
    state: state
  });
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "homeAssistant": haService } },
  getToolbox: getToolbox
}
