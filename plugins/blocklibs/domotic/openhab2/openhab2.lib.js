'use strict';

const http = require('http');
const debug = require('debug')('blockbrain:service:openhab2');
const edebug = require('debug')('blockbrain:service:openhab2:event');

let host = null;
let thingChanged = null;
let updateThingsDelay = 30;

let handlerUpdateThings = null;

let busRequest = null;

let things = {};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  
function config(params) {
    host = params.host || null;
    thingChanged = params.thingChanged || null;
    updateThingsDelay = params.updateThingsDelay || 30;
}

async function start() {
    updateThings();
    handlerUpdateThings = setInterval(updateThings, updateThingsDelay * 1000);
    startEventBus();
    return true;
}

async function stop() {
    debug('OH lib stop');

    if(handlerUpdateThings) clearInterval(handlerUpdateThings);

    if(busRequest) {
        busRequest.abort();
        busRequest = null;
    }
}

async function updateThings() {
    debug('Call to updateThings');

    let data = [];

    http.get(`${host}rest/things`, function(res) {
        res.on('data', (chunk) => { data = [ ...data, ...chunk ]; });
        res.on('end', () => {
            let txtData = (new Buffer(data)).toString();
            let objData = null;
            try {
                objData = JSON.parse(txtData);
            } catch(e) {
                log.w('Could not parse Openhab2 server thing request!');
                debug(txtData);
            }
            
            let newThings = {};
            let newItems = {};

            for(let n = 0; n < objData.length; n++) {
                let obj = objData[n];

                if(!obj.UID) {
                    log.e("Thing received format not recognized!");
                    debug(JSON.stringify(obj));
                } else {
                    let thing = {
                        UID: obj.UID, 
                        label: obj.label, 
                        location: obj.location, 
                        configuration: obj.configuration, 
                        properties: obj.properties, 
                        statusInfo: obj.statusInfo, 
                        channels: {}
                    };

                    if(obj.channels) {
                        for(let c = 0; c < obj.channels.length; c++) {
                            let channel = obj.channels[c];

                        }
                    }

                    newThings[obj.UID] = thing;
                }
            }
            debug("Thing update complete");
        });
        res.on('error', (err) => {
            log.e("Could not update things from Openhab2 server!");
            debug(JSON.stringify(err));
            res.end();
        });
    });
}

function startEventBus() {
    return new Promise((resolve, reject) => {
        var buffer = '';
        
        debug('Initiates OH event bus connection');
        busRequest = http.get(`${host}rest/events`, function(res) {
            res.on('data', function(chunk) {
                //debug('Incoming event bus data');
                chunk = (new Buffer(chunk)).toString('ascii');
                processEventBuffer(chunk);
            });
            res.on('end', function() {
                // all data has been downloaded
                debug('http end event received');
                resolve(true);
                busRequest = null;
            });
            res.on('error', function() {
                debug('http error event received');
                reject();
                busRequest = null;
            });
        });
    });
}

function processEventBuffer(buffer) {
    let lines = buffer.split(/\r?\n/);
    lines.forEach((line) => {
        let matches = line.match(/^data: (\{.+\}$)/)
        if(matches) {
            //debug('Bus data: ' + matches[1]);
            let data;
            try {
                data = JSON.parse(matches[1]);
                if(!data.type) {
                    log.e("Data does not contain 'type' field!");
                    return;
                }
                if(!data.payload) {
                    log.w("Data does not contain 'payload' field!");
                }
                if(!data.topic) {
                    log.w("Data does not contain 'topic' field!");
                }
            } catch(e) {
                log.e("Could not parse event data!");
                debug(matches[1]);
                return;
            }
            
            // From the docs https://www.openhab.org/javadoc/v2.5/org/eclipse/smarthome/core/events/event
            // ChannelTriggeredEvent, ConfigStatusInfoEvent, ExtensionEvent, FirmwareStatusInfoEvent, FirmwareUpdateProgressInfoEvent, FirmwareUpdateResultInfoEvent, GroupItemStateChangedEvent, InboxAddedEvent, InboxRemovedEvent, InboxUpdatedEvent, ItemAddedEvent, ItemChannelLinkAddedEvent, ItemChannelLinkRemovedEvent, ItemCommandEvent, ItemRemovedEvent, ItemStateChangedEvent, ItemStateEvent, ItemStatePredictedEvent, ItemUpdatedEvent, RuleAddedEvent, RuleRemovedEvent, RuleStatusInfoEvent, RuleUpdatedEvent, ThingAddedEvent, ThingRemovedEvent, ThingStatusInfoChangedEvent, ThingStatusInfoEvent, ThingUpdatedEvent
            switch(data.type) {
                // Items ********************************
                case "ItemStateEvent": // {"type":"Decimal","value":"-66"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemStateChangedEvent": // {"type":"Quantity","value":"0.0 s","oldType":"Quantity","oldValue":"282.0 s"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemAddedEvent": // {"type":"Switch","name":"BbBotSwitch_Ymjcb3q_2DtestSwitch_State","label":"state","tags":[],"groupNames":[]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemRemovedEvent": // {"type":"Switch","name":"BbBotSwitch_Ymjcb3q_2DtestSwitch_State","label":"state","tags":[],"groupNames":[]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                // Things ********************************
                case "ThingStatusInfoEvent": // {"status":"ONLINE","statusDetail":"NONE"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ThingStatusInfoChangedEvent": // [{"status":"OFFLINE","statusDetail":"NONE"},{"status":"ONLINE","statusDetail":"NONE"}]
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ThingAddedEvent": // {"label":"bbBot (Switch)","bridgeUID":"mqtt:systemBroker:tron","configuration":{"topics":["switch/testSwitch"],"basetopic":"homeassistant"},"properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","vendor":"BlockBrain"},"UID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q","channels":[]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ThingRemovedEvent": // {"label":"bbBot (Switch)","bridgeUID":"mqtt:systemBroker:tron","configuration":{"topics":["switch/testSwitch"],"basetopic":"homeassistant"},"properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","vendor":"BlockBrain"},"UID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q","channels":[{"uid":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q:ymjcb3q_2DtestSwitch#switch","id":"ymjcb3q_2DtestSwitch#switch","channelTypeUID":"mqtt:ymjcb3q_2DtestSwitch_switch","itemType":"Switch","kind":"STATE","label":"state","defaultTags":[],"properties":{},"configuration":{"component":"switch","config":"{\"name\":\"testSwitch\",\"unique_id\":\"ymjcb3q-testSwitch\",\"icon\":\"mdi:battery\",\"state_topic\":\"bbBot/switch/testSwitch/state\",\"availability_topic\":\"bbBot/testSwitch/status\",\"device\":{\"identifiers\":\"ymjcb3q\",\"name\":\"bbBot\",\"model\":\"BlockBrain\",\"manufacturer\":\"BlockBrain\",\"sw_version\":\"BlockBrain\"},\"command_topic\":\"bbBot/switch/testSwitch/command\",\"state_on\":\"ON\",\"state_off\":\"OFF\",\"payload_on\":\"ON\",\"payload_off\":\"OFF\"}","nodeid":"","objectid":"testSwitch"}}]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                // Inbox ********************************
                case "InboxUpdatedEvent": // {"bridgeUID":"mqtt:systemBroker:tron","flag":"NEW","label":"bbBot (Switch)","properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","topics":["switch/testSwitch"],"vendor":"BlockBrain","basetopic":"homeassistant"},"representationProperty":"objectid","thingUID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "InboxRemovedEvent": // {"bridgeUID":"mqtt:systemBroker:tron","flag":"NEW","label":"bbBot (Switch)","properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","topics":["switch/testSwitch"],"vendor":"BlockBrain","basetopic":"homeassistant"},"representationProperty":"objectid","thingUID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;


                default:
                    log.w(`Cannot manage event ${data.type}`);
                    debug(JSON.stringify(data, null, 2));
                    break;
            }
        }
    });
}

function getEntities() {
    return things;
}

async function ping() {
    let ret = await doGetSync("");
    return ret.message == 'API running.';
}

async function getConfig() {
    let ret = await doGetSync("config");
    if(ret.error) return null;
    return ret.components;
}

async function getInfo() {
    let ret = await doGetSync("discovery_info");
    if(!ret.error) return ret;
}

async function getStates() {
    let ret = await doGetSync("states");
    if(ret.error) throw(ret.error);
    return ret;
}

/*async function tick(self) {
    var states = await self.getStates();

    states.forEach(s => {
        if(!(s.entity_id in things)) {
            // Thing not read before
            things[s.entity_id] = {
                state: s.state || "unavailable",
                attributes: s.attributes || {}, 
                lastChanged: s.last_changed || "", 
                lastUpdated: s.last_updated || ""
            };
            debug(`New Home Assistant item ${s.entity_id} [${s.state}]`)
        } else {
            if(things[s.entity_id].state != s.state || things[s.entity_id].lastChanged != s.last_changed) {
                let oldState = things[s.entity_id].state;
                things[s.entity_id] = {
                    state: s.state || "unavailable",
                    attributes: s.attributes || {}, 
                    lastChanged: s.last_changed || "", 
                    lastUpdated: s.last_updated || ""
                };
                debug(`Thing ${s.entity_id} changed state from ${oldState} to ${s.state}`);
                if(thingChanged)
                    thingChanged(s.entity_id, s.state, oldState);
            }
        }
    });
}*/

async function setState(entity, newState = null, attributes = null) {
    debug(`Set entity ${entity} state to ${newState}`);

    if(attributes === null) 
        attributes = (entity in things) ? things[entity].attributes : {};

    if(entity in things) {
        things[entity].state = newState;
        things[entity].attributes = attributes;
    }

    doPostSync("states/" + entity, {
        state: newState, 
        attributes: attributes
    });
}

module.exports = {
    config: config, 
    start: start, 
    stop: stop, 
    getEntities: getEntities, 
    ping: ping, 
    getConfig: getConfig, 
    getInfo: getInfo, 
    getStates: getStates, 
//    tick: tick, 
    setState: setState
}
