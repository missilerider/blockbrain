'use strict';

const mqtt = require('mqtt');
const lib = require('./mqtt.lib.js');
const ha = require('./mqtt.ha.lib.js');

const debug = require('debug')('blockbrain:service:mqtt');
const log = global.log;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var runPromise = null;
var runPromiseResolve = null;

var tools = null;
var client = null;
var config = null;
var topics = {};
var topicRgx = [];

var thingSubs = {};

var messageBlock = {
  "block": lib.message,
  "run":
    async (context) => {
      context.blockIn();
      var rgx = context.getField('RGX');
      let matches = false;
      try {
        matches = context.getVar('msg').topic.match(rgx);
      } catch(e) {
        log.e("Regular expression error: " + e.message);
        log.trace();
      }
      if(matches)
        return await context.continue("CMD");
  }
}

var publishMessageBlock = {
  "block": lib.publishMessage,
  "run":
    async (context) => {
      context.blockIn();
      var topic = context.getField('TOPIC');
      debug("MQTT publish on " + topic);
      if(!runPromise) {
        log.e("MQTT service stopped. Cannot send to '" + topic + "'");
        return;
      }

      var message = await context.getValue('MSG');
      switch(typeof message) {
        default:
        case "number": message = message.toString(); break;
        case "string": break;
        case "object": message = JSON.stringify(message); break;
        case "undefined":
        case "null": message = ""; break;
      }
      client.publish(topic, message);
  }
}

var publishMessageExBlock = {
  "block": lib.publishMessageEx,
  "run":
    async (context) => {
      context.blockIn();
      var topic = await context.getValue('TOPIC');
      debug("MQTT publish on " + topic);
      if(!runPromise) {
        log.e("MQTT service stopped. Cannot send to '" + topic + "'");
        return;
      }

      var message = await context.getValue('MSG');
      switch(typeof message) {
        default:
        case "number": message = message.toString(); break;
        case "string": break;
        case "object": message = JSON.stringify(message); break;
        case "undefined":
        case "null": message = ""; break;
      }

      var qos = context.getField('QOS');
      var retain = context.getField('RETAIN');
      var expiry = context.getField('EXPIRY');

      let ops = {
        qos: parseInt(qos),
        retain: retain == "TRUE",
        properties: {
          messageExpiryInterval: parseInt(expiry)
        }
      };

      debug("topic" + JSON.stringify(topic));
      debug("message" + JSON.stringify(message));
      debug("ops" + JSON.stringify(ops));

      client.publish(topic, message, ops);
  }
}

function getInfo(env) {
  return {
    "id": "mqtt",
    "name": "MQTT management library",
    "author": "Alfonso Vila"
  }
}

async function getBlocks() {
  var blocks = {
    "message": messageBlock,
    "publish": publishMessageBlock,
    "publishEx": publishMessageExBlock
  };

  blocks = Object.assign(blocks, await ha.getBlocks());
  return blocks;
}

function getToolbox() {
  return {
    "mqtt": {
      "Events": ' \
      <block type="mqtt.message"></block>',
      "Functions": ' \
        <block type="mqtt.publish"></block> \
        <block type="mqtt.publishEx"></block>'
    }, 
    "home assistant": {
      "Sensor": ' \
        <block type="mqtt.haSetSensor"></block>', 
      "Switch": ' \
        <block type="mqtt.haSwitchEvent"></block> \
        <block type="mqtt.haSetSwitch"></block>', 
      "General": ' \
        <block type="mqtt.haThingEnable"></block>'
    }
  }
}

function refreshSubscriptions() {
  let keys = Object.keys(config.topics);

  keys.forEach((t) => {
    client.subscribe(t, function() {
      debug("MQTT subscribed to " + t);
    });
  });
}

function setConfig(newConfig) {
  config = Object.assign(lib.baseConfig, newConfig);

  let keys = Object.keys(config.topics);
  for(let n = 0; n < keys.length; n++) {
    let rgx = keys[n].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    rgx = rgx.replace("\\+", "[^/]+");
    rgx = rgx.replace("#", ".+");
    debug(rgx);
    topicRgx[n] = rgx;
    topics[rgx] = config.topics[keys[n]];
  }
}

function onMessage(topic, message, packet) {
  let sent = false;
  debug("Received '" + message + "' on '" + topic + "'");
  for(let n = 0; n < topicRgx.length; n++) {
    if(topic.match(topicRgx[n])) {
      if(!sent || !config.messaging.deduplicate) {
        debug("Match! " + topic + " = " + topicRgx[n] + " => " + message);
        sent = true;

        let data = message;
        let exact = false;
        if("format" in topics[topicRgx[n]]) {
          switch(topics[topicRgx[n]].format) {
            case "text": data = message.toString(); exact = true; break;
            case "json":
              try {
                data = JSON.parse(message.toString());
                exact = true;
              } catch(e) {
                exact = false;
                data = message.toString();
              }
              break;
            case "number":
            try {
              data = Number.parseFloat(message);
              exact = true;
            } catch(e) {
              exact = false;
              data = message.toString();
            }
            break;
          }
        }

        if(topics[topicRgx[n]].filter && !exact) {
          debug("MQTT message format & filter not met: " + topics[topicRgx[n]].format);
        } else {
          tools.executeEvent('mqtt.message', {
            topic: topic,
            message: data
          });
        }
      }
    }
  }

  Object.keys(thingSubs).forEach((tTopic) => {
    if(tTopic == topic) {
      debug("Topic matches thing " + thingSubs[tTopic].id);
      let block = thingSubs[tTopic].onMessage(topic, message);
      if(block) {
        tools.executeEvent('mqtt.' + block, {
          thing: thingSubs[tTopic]
        });
      }
    }
  });
}

var mqttService = {
  getInfo: () => { return {
    methods: ["start", "stop"],
    name: "MQTT Service",
    description: "Subscribes to a MQTT broker topics and publishes messages"
  }},
  status: () => { return "TODO"; },
  start: (srv) => {
    setConfig(srv.config);
    return true;
  },
  stop: async (srv) => {
    setConfig(srv.config);
    if(client) {
      if(config.homeAssistant.enabled) {
        debug("Stopping HomeAssistant middleware");
        await ha.stop();
        await sleep(1000);
        debug("HA stopped");
      }

      debug("Closing MQTT client");
      client.end();
      debug("MQTT closed");
      client = null;
    }
    if(!runPromise || !runPromiseResolve) return false;
    runPromiseResolve();
    runPromise = null;
    runPromiseResolve = null;
  },
  run: async (srv, srvTools) => {
    tools = srvTools;
    setConfig(srv.config);

    if(runPromise || runPromiseResolve) return false; // Must stop before
    runPromise = new Promise(resolve => {
      runPromiseResolve = resolve;
    });

    let host = "";
    let defaultPort = 1883;

    switch(config.broker.protocol) {
      default:
      case "mqtt": host = 'mqtt://'; break;
      case "mqtts": host = 'mqtts://'; defaultPort = 8883; break;
      case "tls": host = 'tls://'; defaultPort = 8883; break;
    }

    host += config.broker.host;

    let ops = {
      "port": config.broker.port || defaultPort,
      "keepalive": config.broker.keepalive,
      "reconnectPeriod": config.broker.reconnectPeriod,
      "connectTimeout": config.broker.connectTimeout,
      "protocolVersion": config.broker.version
    };

    if(config.broker.username)
      ops.username = config.broker.username;
    if(config.broker.password)
      ops.password = config.broker.password;
    if(config.broker.reconnectPeriod)
      ops.reconnectPeriod = config.broker.reconnectPeriod;
    if(config.broker.validateCertificate)
      ops.rejectUnauthorized = config.broker.validateCertificate == true;

    debug("Starting MQTT connection to " + host);
    client  = mqtt.connect(host, ops);

    let srv2 = srv;
    debug("Starting MQTT broker connection");
    client.on('connect', function() {
      srv2.status = 1;
      debug("MQTT broker connection OK");

      client.on('message', onMessage);

      client.on('reconnect', () => { debug("MQTT reconnecting...") });
      client.on('close', () => { log.e("MQTT disconnected") });
      client.on('disconnect', () => { log.w("MQTT received diconnect from broker") });
      client.on('offline', () => { log.f("MQTT offline") });

      refreshSubscriptions();

      if(config.homeAssistant.enabled) {
        debug("Starting HomeAssistant middleware");
        ha.start({
          mqttLib: client, 
          config: config, 
          service: mqttService
        });
      }
    });

    debug("MQTT initialization complete");

    await runPromise;

    srv2.status = 0;
    debug("MQTT service stopped");
  }, 
  getThing(thingName) {
    return ha.getThing(thingName);
  }, 
  getThings(p) { return ha.getThings(p); }, 
  addThingSubscription: function(topic, thing) {
    thingSubs[topic] = thing;
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "mqtt": mqttService } },
  getToolbox: getToolbox
}
