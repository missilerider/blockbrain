"use strict";

var client;
var config;
var initialized = false;

const swVersion = global.blockbrainVersion;

function start(options) {
    initialized = true;
    config = options.config;
    client = options.mqttLib;

    client.on('message', onMessage);
    client.subscribe(config.homeAssistant.prefix + "/+/+", function() {
        log.i("Waiting for HA messages...");
    });

    if(config.homeAssistant.discovery.enabled) {
        renewDiscovery();
        setTimeout(renewDiscovery, config.homeAssistant.discovery.renewalMins * 60 * 1000);
    }
}

function stop() {
    if(!initialized) {
        log.w("Trying to stop HomeAssistant middleware, but it has not been initialized!");
        return;
    }

    initialized = false;
}

function renewDiscovery() {
    log.i("HA discovery renew");
    if(!"items" in config.homeAssistant) return;
    let items = config.homeAssistant.items;
    Object.keys(items).forEach((type) => {
        Object.keys(items[type]).forEach((id) => {
            let topic = config.homeAssistant.discovery.prefix + "/" + type + "/" + id + "/config";
            let msg = buildDiscovery(type, id, items[type][id]);

            let ops = {
                qos: 0,
                retain: "TRUE",
                properties: {
                  messageExpiryInterval: 60
                }
              };
        
            client.publish(topic, JSON.stringify(msg), ops);

            // online
            client.publish(config.homeAssistant.prefix + "/" + id + "/avail", "online");
        });
    });
}

function buildDiscovery(type, id, item) {
    let msg = {
        "name": id, 
        "unique_id": config.homeAssistant.idPrefix + id, 
        "state_topic": config.homeAssistant.prefix + "/" + id + "/state", 
        "availability_topic": config.homeAssistant.prefix + "/" + id + "/avail", 
        "payload_available": "online", 
        "payload_not_available": "offline", 
        "qos": 0
    };

    if(item.device) {
        msg.device = {
            "identifiers": config.homeAssistant.idPrefix + item.device, 
            "name": item.device, 
            "model": "BlockBrain", 
            "manufacturer": "BlockBrain", 
            "sw_version": "Blockbrain " + swVersion
        }
    }

    msg.expire_after = undefined; // Defines the number of seconds after the value expires if it’s not updated. After expiry, the value is cleared, and the availability is set to false

    switch(type) {
        case "binary_sensor":
            msg.payload_on = "ON";
            msg.payload_off = "OFF";
            msg.device_class = item.device_class;
            msg.force_update = item.force_update;
            break;

        case "switch":
            msg.command_topic = config.homeAssistant.prefix + "/" + id + "/cmd";
            msg.icon = item.icon;
            msg.state_on = "ON";
            msg.state_off = "OFF";
            msg.payload_on = "ON";
            msg.payload_off = "OFF";
            break;
    }

    return msg;
}

function onMessage(topic, message, packet) {
    let matches = topic.match("^" + config.homeAssistant.prefix + "/([^/]+)/([^/]+)$");

    if(!matches) return;

    let msg = message.toString();
    let id = matches[1];
    let cmd = matches[2];

    log.i("Incoming HA message at " + topic + " (" + msg + ")");

    let types = [
        "binary_sensor", 
        "switch"
    ]

    for(let n = 0; n < types.length; n++) {
        if(id in config.homeAssistant.items[types[n]]) {
            log.d("Command " + cmd + " on item " + id);
            let item = config.homeAssistant.items[types[n]][id];
            switch(cmd) {
                case "cmd": 
                    client.publish(config.homeAssistant.prefix + "/" + id + "/state", msg);
                    break;
            }
            return;
        }
    }
}

module.exports = {
    start: start, 
    stop: stop
}
