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
    "id": "openhab2",
    "name": "Openhab2 REST API integration",
    "author": "Alfonso Vila"
  }
}

function entitiesCombo(base, all = false) {
  let ret = { ... base };
  let things = oh.getThings();
  let thingLabels = [];
  let thingsByLabel = {};
  let thingIds = Object.keys(things);

  for(let n = 0; n < thingIds.length; n++) {
    thingsByLabel[things[thingIds[n]].label] = things[thingIds[n]];
    thingLabels.push(things[thingIds[n]].label);
  }

  thingLabels = thingLabels.sort();

  let combo = [];
  if(all)
    ret.args0[0].options = [[ "<any thing>", "___ALL___" ]];

  for(let n = 0; n < thingLabels.length; n++) {
      combo.push([ thingLabels[n], thingsByLabel[thingLabels[n]].uid ]);
  }
  ret.args0[0].options = combo;
  if(ret.args0[0].options.length == 0)
      ret.args0[0].options = [[ "<no things>", "___NONE___" ]];

  return ret;
}

var onItemStateEventBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.onItemState, true);
  },
  "run": async (context) => {
    context.blockIn();

    var thingId = context.getField('THING');
    var channelVar = context.getField('CHANNEL');
    var valueVar = context.getField('VALUE');

    if(thingId === '___ALL___' || thingId == context.params.thing) {
      context.setVar(channelVar, context.params.channel);
      context.setVar(valueVar, context.params.value);

      return await context.continue("CMD");
    }
  }
}

var onItemStateChangedEventBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.onItemStateChanged, true);
  },
  "run": async (context) => {
    context.blockIn();

    var thingId = context.getField('THING');
    var channelVar = context.getField('CHANNEL');
    var oldValueVar = context.getField('OLDVALUE');
    var valueVar = context.getField('VALUE');

    if(thingId === '___ALL___' || thingId == context.params.thing) {
      context.setVar(channelVar, context.params.channel);
      context.setVar(oldValueVar, context.params.oldValue);
      context.setVar(valueVar, context.params.value);

      return await context.continue("CMD");
    }
  }
}

var getThingChannelsBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.getThingChannels);
  },
  "run": async (context) => {
    context.blockIn();
    let thing = await context.getValue('THING');

    let things = oh.getThings();
    if(!(thing in things)) return null;
    return Object.keys(things[thing].channels);
  }
}

var getThingChannelsParamBlock = {
  "block": blocks.getThingChannelsParam,
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var newState = await context.getValue('NEWSTATE');
    var newAttr = await context.getValue('NEWATTR');

    oh.setState(entity, errornewState, newAttr);
  }
}

var getChannelPropertyBlock = {
  "block": blocks.getChannelProperty,
  "run": async (context) => {
    context.blockIn();
    var channel = await context.getValue('CHANNEL');
    var prop = await context.getField('PROP');

    let ch = oh.getChannel(channel);

    switch(prop) {
      case "LABEL": return ch.label;
      case "THING": return ch.thing.uid;
      case "PROPERTIES": return ch.properties;
      case "UID": return ch.uid;
      case "DEFAULTTAGS": return ch.defaultTags;
      case "KIND": return ch.kind;
      case "ITEMTYPE": return ch.itemType;
      case "CONFIGURATION": return ch.configuration;
    }

    log.f(`Openhab2 library cannot understand channel property ${prop}. Is script saved using a greater OH2 lib version?`);
    return null;
  }
}

var getStateBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.getState);
  },
  "run": async (context) => {
    context.blockIn();
    var entity = context.getField('THING');
    var entities = oh.getThings();

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
    var entities = oh.getThings();

    if(entity in entities) return entities[entity].attributes;
    log.e(`Openhab2 entity ${entity} not found!`);
    return "";
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

      onItemStateEvent: onItemStateEvent, 
      onItemStateChangedEvent: onItemStateChangedEvent
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

function onItemStateEvent(data) {
  //log.f(`${data.thing.uid} [${data.channel.uid}]: ${data.value}`);
  tools.executeEvent('openhab2.onItemStateEvent', {}, {
    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: data.value
  });
}

function onItemStateChangedEvent(data) {
  //log.f(`${data.thing.uid} [${data.channel.uid}]: ${data.oldValue} => ${data.value}`);
  tools.executeEvent('openhab2.onItemStateChangedEvent', {}, {
    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: data.value, 
    oldValue: data.oldValue
  });
}

async function getBlocks() {
  var blocks = {
    // Events
    "onItemStateEvent": onItemStateEventBlock, 
    "onItemStateChangedEvent": onItemStateChangedEventBlock, 

    // Channel Methods
    "getThingChannels": getThingChannelsBlock, 
    "getThingChannelsParam": getThingChannelsParamBlock, 
    "getChannelProperty": getChannelPropertyBlock
  };

  return blocks;
}

function getToolbox() {
  return {
    "openhab2": {
      "Things": '', 
      "Thing Events": ' \
        <block type="openhab2.onItemStateEvent"></block> \
        <block type="openhab2.onItemStateChangedEvent"></block> \
        <block type="openhab2.getThingChannels"></block> \
        <block type="openhab2.getThingChannelsParam"></block> \
        <block type="openhab2.getChannelProperty"></block> \
        '
    }
  }
}

module.exports = {
  getInfo: () => { return {
      "id": "openhab2",
      "name": "Openhab2 REST API integration",
      "author": "Alfonso Vila"
    } }, 
  getBlocks: getBlocks,
  getServices: () => { return { "openhab2": ohService } },
  getToolbox: getToolbox
}
