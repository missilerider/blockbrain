'use strict';

const mqtt = require('mqtt')
const lib = require('./mqtt.lib.js');
const log = global.log;

var runPromise = null;
var runPromiseResolve = null;

var tools = null;
var client = null;
var config = null;
var topics = {};
var topicRgx = [];

var messageBlock = {
  "block": lib.message,
  "run":
    async (context) => {
      var rgx = context.getField('RGX');
      let matches = false;
      try {
        matches = context.getVar('msg').topic.match(rgx);
      } catch(e) {
        log.e("Regular expression error: " + e.message);
      }
      if(matches)
        return await context.continue("CMD");
  }
}

var publishMessageBlock = {
  "block": lib.publishMessage,
  "run":
    async (context) => {
      var topic = context.getField('TOPIC');
      log.d("MQTT publish on " + topic);
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
      var topic = await context.getValue('TOPIC');
      log.d("MQTT publish on " + topic);
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

      log.d("Envia " + message);

      let ops = {
        qos: parseInt(qos),
        retain: retain == "TRUE",
        properties: {
          messageExpiryInterval: parseInt(expiry)
        }
      };

      log.dump("topic", topic);
      log.dump("message", message);
      log.dump("ops", ops);

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

function getBlocks() {
  return {
    "message": messageBlock,
    "publish": publishMessageBlock,
    "publishEx": publishMessageExBlock
  };
}

function getToolbox() {
  return {
    "mqtt": {
      "Events": ' \
        <block type="mqtt.message"></block>',
      "Functions": ' \
        <block type="mqtt.publish"></block> \
        <block type="mqtt.publishEx"></block>'
    }
  }
}

function refreshSubscriptions() {
  let keys = Object.keys(config.topics);

  keys.forEach((t) => {
    client.subscribe(t, function() {
      log.i("MQTT subscribed to " + t);
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
    log.i(rgx);
    topicRgx[n] = rgx;
    topics[rgx] = config.topics[keys[n]];
  }
}

function onMessage(topic, message, packet) {
  let sent = false;
  log.i("Received '" + message + "' on '" + topic + "'");
  for(let n = 0; n < topicRgx.length; n++) {
    if(topic.match(topicRgx[n])) {
      if(!sent || !config.messaging.deduplicate) {
        log.d("Match! " + topic + " = " + topicRgx[n] + " => " + message);
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
          log.d("MQTT message format & filter not met: " + topics[topicRgx[n]].format);
        } else {
          tools.executeEvent('mqtt.message', {
            topic: topic,
            message: data
          });
        }
      }
    }
  }
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
  stop: (srv) => {
    setConfig(srv.config);
    if(client) {
      log.d("Closes MQTT client");
      client.end();
      log.d("MQTT closed");
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

    log.d("Starting MQTT connection to " + host);
    client  = mqtt.connect(host, ops);

    let srv2 = srv;
    client.on('connect', function() {
      srv2.status = 1;
      log.i("MQTT broker connection OK");

      client.on('message', onMessage);

      client.on('reconnect', () => { log.i("MQTT reconnecting...") });
      client.on('close', () => { log.i("MQTT disconnected") });
      client.on('disconnect', () => { log.i("MQTT received diconnect from broker") });
      client.on('offline', () => { log.i("MQTT offline") });

      refreshSubscriptions();
    });

    await runPromise;

    srv2.status = 0;
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "mqtt": mqttService } },
  getToolbox: getToolbox
}
