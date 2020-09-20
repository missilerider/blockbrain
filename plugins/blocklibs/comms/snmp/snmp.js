'use strict';

const blocks = require('./snmp.blocks.lib.js');

console.log(blocks);

const code = require('./snmp.code.lib.js');

const debug = require('debug')('blockbrain:service:snmp');
const log = global.log;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var tools = null;
var hosts = {};

function hostsCombo(base, all = false) {
  let ret = { ... base };
  let things = oh.getThings();
  let thingLabels = [];
  let thingsByLabel = {};
  let thingIds = Object.keys(things);

  for(let n = 0; n < thingIds.length; n++) {
    thingsByLabel[things[thingIds[n]].label] = things[thingIds[n]].uid;
    thingLabels.push(things[thingIds[n]].label);
  }

  thingLabels = thingLabels.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));

  if(all) {
    thingsByLabel["<any thing>"] = "___ALL___";
    thingLabels.unshift("<any thing>");
  }

  let combo = [];

  for(let n = 0; n < thingLabels.length; n++) {
      combo.push([ thingLabels[n], thingsByLabel[thingLabels[n]]]);
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

var onChannelStateEventBlock = {
  "block": function(services) {
    return entitiyChannelsCombo(blocks.onChannelState, true);
  },
  "run": async (context) => {
    context.blockIn();

    var channelId = context.getField('CHANNEL');
//    var channelVar = context.getField('CHANNEL');
    var valueVar = context.getField('VALUE');

    if(channelId === '___ALL___' || channelId == context.params.channel) {
      context.setVar(valueVar, context.params.value);

      return await context.continue("CMD");
    }
  }
}

var onThingStatusChangedBlock = {
  "block": function(services) {
    return entitiesCombo(blocks.onThingStatusChanged, true);
  },
  "run": async (context) => {
    context.blockIn();

    var thingId = context.getField('THING');
    var oldStatusVar = context.getField('OLDSTATUS');
    var statusVar = context.getField('STATUS');

    debug(thingId);
    debug(context.params);

    if(thingId === '___ALL___' || thingId == context.params.thing) {
      context.setVar(oldStatusVar, context.params.oldStatus);
      context.setVar(statusVar, context.params.status);

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

function onItemStateEvent(data) {
  //log.f(`${data.thing.uid} [${data.channel.uid}]: ${data.value}`);
  tools.executeEvent('openhab2.onItemStateEvent', {}, {
    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: data.value
  });

//  log.f("Evento onItemStateEvent / channel");
//  console.dir(data);
  log.d("Dispara eventos onChannelStateEvent: " + data.channel.uid);
  tools.executeEvent('openhab2.onChannelStateEvent', {}, {
//    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: data.value, 
    data: data
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
function onChannelValueChanged(data, value, oldValue) {
  //log.f(`${data.thing.uid} [${data.channel.uid}]: ${data.oldValue} => ${data.value}`);
  tools.executeEvent('openhab2.onChannelStateEvent', {}, {
    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: value, 
    oldValue: oldValue
  });

  tools.executeEvent('openhab2.onItemStateChangedEvent', {}, {
    thing: data.thing.uid,
    channel: data.channel.uid, 
    value: value, 
    oldValue: oldValue
  });
}

function onThingStatusChanged(data, status, oldStatus) {
  tools.executeEvent('openhab2.onThingStatusChangedEvent', {}, {
    thing: data.thing.uid,
    oldStatus: oldStatus.status, 
    status: status.status
  });
}

async function getBlocks() {
  return {
    // Query
    "readOids": { 
      block: (services) => { return hostsCombo(blocks.readOids, false); }, 
      run: code.readOids }, 
  };
}

function getToolbox() {
  return {
    "snmp": {
      "Query": ' \
        <block type="snmp.readOids"></block> \
      ', 
      "Libraries": ' \
        ', 
      "User": ' \
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
  start: (srv, tools) => {
    utils = tools.utils;
    hosts = utils.loadServiceAdditionalConfig(SERVICE_NAME, "devices");
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

    lib.config({
      host: host, 
      updateThingsDelay: srv.config.updateThingsDelay, 

      // Events
      onThingStatusChanged: onThingStatusChanged, 

//      onItemStateEvent: onItemStateEvent, 
//      onItemStateChangedEvent: onItemStateChangedEvent, 

      onChannelValueChanged: onChannelValueChanged
    });

    if(!await oh.start()) {
      log.e('Openhab2 service cannot subscribe to event bus');
    } else {
      debug(`Event bus subscription to host ${host} correct and running`);
    }

    srv.status = 1;
  
    debug("Openhab2 connection correct!");

    await runPromise;

    debug('OH stop');

    oh.stop(); // Stops thing updates and everything
   
    //clearInterval(intervalHandler);

    srv.status = 0;
    debug("Openhab2 REST API service stopped");
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
