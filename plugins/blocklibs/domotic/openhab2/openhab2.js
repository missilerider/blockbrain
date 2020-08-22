'use strict';

const oh = require('./openhab2.lib.js');
const blocks = require('./openhab2.blocks.lib.js');

const debug = require('debug')('blockbrain:service:openhab2');
const log = global.log;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var tools = null;

var metadataTag = "blockbrain";

function getInfo(env) {
  return {
    "id": "openhab",
    "name": "Openhab2 REST API integration",
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
  let things = oh.getEntities();
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

    oh.setState(entity, newState);
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

    oh.setState(entity, errornewState, newAttr);
  }
}

var getStateBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.getState);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var entities = oh.getEntities();

    if(entity in entities) return entities[entity].state;
    log.e(`Openhab2 entity ${entity} not found!`);
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
    var entities = oh.getEntities();

    if(entity in entities) return entities[entity].attributes;
    log.e(`Openhab2 entity ${entity} not found!`);
    return "";
  }
}

function getToolbox() {
  return {
    "home assistant": {
      "Sensor": '', 
      "Switch": '',
      "General": ' \
        <block type="openhab2.onChange"></block> \
        <block type="openhab2.setState"></block> \
        <block type="openhab2.setAttributes"></block> \
        <block type="openhab2.getState"></block> \
        <block type="openhab2.getAttributes"></block>'
    }
  }
}

var ohService = {
  getInfo: () => { return {
    methods: ["start", "stop"],
    name: "Openhab2 REST API integration",
    description: "Connects directly to a Openhab2 instance and exposes events and things"
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

    let host = srv.config.baseUrl || null;
    metadataTag = srv.config.metadataTag || "blockbrain";

    if(!host) {
      log.f("openhab2.json baseUrl field must be defined at least for Openhab2 integration");
      srv.status = 0;
      return;
    }

    oh.config({
      host: host, 
      updateThingsDelay: srv.config.updateThingsDelay, 

      // Events
      onThingChanged: onThingChanged, 

      onItemChanged: onItemChanged
    });

    if(!await oh.start()) {
      log.e('Openhab2 service cannot subscribe to event bus');
    } else {
      debug(`Event bus subscription to host ${host} correct and running`);
    }

    srv.status = 1;
  
    debug("Openhab2 connection correct!");

    /*var intervalHandler = setInterval(async () => {
      oh.tick(oh);
    }, 2000);*/

    await runPromise;

    debug('OH stop');

    oh.stop(); // Stops thing updates and everything
   
    //clearInterval(intervalHandler);

    srv.status = 0;
    debug("Openhab2 REST API service stopped");
  }
}

function onThingChanged(oldThing, newThing) {
  debug(`Openhab2 entity changed ${newThing.label}: ${oldThing.label}`);

/*  tools.executeEvent('openhab2.onChange', { entity: entity }, {
    entity: entity,
    oldState: oldState, 
    state: state
  });*/
}

function onItemChanged(data) {

}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "openhab2": ohService } },
  getToolbox: getToolbox
}
