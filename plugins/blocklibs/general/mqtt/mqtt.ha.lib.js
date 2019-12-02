"use strict";

var client;
var config;
var service;
var initialized = false;
const thingClasses = require("./mqtt.ha.things.lib.js");

const swVersion = global.blockbrainVersion;

var things = {};

function start(options) {
    initialized = true;
    config = options.config;
    client = options.mqttLib;
    service = options.service;

    client.on('message', onMessage);
    client.subscribe(config.homeAssistant.prefix + "/+/+", function() {
        log.i("Waiting for HA messages...");
    });

    createThings();
}

async function stop() {
    if(!initialized) {
        log.w("Trying to stop HomeAssistant middleware, but it has not been initialized!");
        return;
    }

    var thingIds = Object.keys(things);
    for(let t = 0; t < thingIds.length; t++) {
        await things[thingIds[t]].disconnect();
    }

    initialized = false;
}

function createThings() {
    log.i("HA thing creation");
    if(!"devices" in config.homeAssistant) return;
    let devices = config.homeAssistant.devices;
    Object.keys(devices).forEach((deviceName) => {
        let device = devices[deviceName];
        let deviceIdentifier = device.identifier || 
            Buffer.from(deviceName).toString('base64').replace(/=/g, '').toLowerCase();

        log.d("Creates device " + deviceName);

        if("items" in device) {
            Object.keys(device.items).forEach((itemName) => {
                let item = device.items[itemName];
                log.d("Creates item " + deviceName + "." + itemName);
                if(("haThing_" + item.type) in thingClasses) {
                    things[itemName] = new thingClasses["haThing_" + item.type]({
                        mqtt: client, 
                        mqttSrv: service, 
                        type: item.type, 
                        id: itemName,
                        device: deviceName, 
                        deviceIdentifier: deviceIdentifier, 
                        uniqueId: item.uniqueId || deviceIdentifier + "-" + itemName, 

                        discoveryTopic: config.homeAssistant.discovery.prefix + "/" + item.type + "/" + itemName + "/config", 
//                        availabilityTopic: "blockbrain/" + deviceName + "/status", 

                        icon: item.icon, 
                        initialState: item.initialState
                    });

                    things[itemName].connect();

                    if(config.homeAssistant.discovery.enabled) {
                        log.d("Enables discovery for thing " + itemName);
                        things[itemName].discovery();
                    }
                }
            });
        }
    });
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
    ];

    for(let n = 0; n < types.length; n++) {
        if(config.homeAssistant.items[types[n]] && id in config.homeAssistant.items[types[n]]) {
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

function getThing(thingName) {
    if(things 
        && thingName in things)
        return things[thingName];
    
    return null;
}

function getThings(thingClass = null) {
    if(thingClass === null) return things;
    let ret = [];
    let names = Object.keys(things);
    for(let n = 0; n < names.length; n++) {
        if(things[names[n]].type === thingClass) {
            ret.push(things[names[n]]);
        }
    }
    return ret;
}

async function getBlocks() {
    return require('./mqtt.ha.blocks.lib.js');
}

module.exports = {
    getBlocks: getBlocks, 
    start: start, 
    stop: stop, 
    getThing: getThing, 
    getThings: getThings
}
