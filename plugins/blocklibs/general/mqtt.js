'use strict';

const mqtt = require('mqtt')
const lib = require('./mqtt.lib.js');
const log = global.log;

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

function getInfo(env) {
  return {
    "id": "mqtt",
    "name": "MQTT management library",
    "author": "Alfonso Vila"
  }
}

function getBlocks() {
  return {
    "message": messageBlock
  };
}

function getToolbox() {
  return {
    "mqtt": {
      "Events": ' \
        <block type="mqtt.message"></block>'
    }
  }
}

function refreshSubscriptions() {
  let keys = Object.keys(topics);
  for(let n = 0; n < keys.length; n++) {

  }

  keys = Object.keys(config.topics);

  keys.forEach((t) => {
    client.subscribe(t, function() {
      log.d("MQTT subscribed to " + t);
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
    methods: ["start", "stop", "status"],
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
  },
  run: async (srv, srvTools) => {
    tools = srvTools;
    setConfig(srv.config);

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

    client.on('connect', function() {
      log.i("MQTT broker connection OK");

      client.on('message', onMessage);

      refreshSubscriptions();
    });

    srv.status = 1;
/*
    while(!srv.stop) {
      let msg = await bot.getUpdates();
      for(let n = 0; n < msg.length; n++) {
        if(msg[n] instanceof telegram.Message) {
          // Commands also contain 'text' and should not be executed in 'text'
          if('text' in msg[n] && !('commands' in msg[n])) {
            log.d("Telegram text: " + msg[n].text);
            await tools.executeEvent('telegram.telegram_text', {
              text: msg[n].text,
              message: msg[n]
            });
          }

          if('commands' in msg[n]) {
            for(let c = 0; c < msg[n].commands.length; c++) {
              log.d("Telegram command: " + msg[n].commands[c].command);
              await tools.executeEvent('telegram.telegram_cmd', {
                text: msg[n].text,
                command: msg[n].commands[c].command,
                params: msg[n].commands[c].params,
                message: msg[n]
              });
            }
          }

          if('document' in msg[n]) {
            log.d("Telegram document: " + msg[n].document.file_name);
            await tools.executeEvent('telegram.telegram_document', {
              fileName: msg[n].document.file_name,
              message: msg[n]
            });
          }
        } else if(msg[n] instanceof telegram.CallbackQuery) {
          log.d("Telegram callbackquery: " + msg[n].data);
          let params = {
            data: msg[n].data,
            callbackQuery: msg[n]
          };

          if('message' in msg[n]) {
            params.text = msg[n].message.text;
            params.chat = msg[n].message.chat;
          }

          await tools.executeEvent('telegram.telegram_callback_query', params);
        }
      }
    }

    srv.status = 0;*/
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "mqtt": mqttService } },
  getToolbox: getToolbox
}
