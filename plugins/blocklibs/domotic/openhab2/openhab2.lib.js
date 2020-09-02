'use strict';

const http = require('http');
const _ = require('lodash');
const debug = require('debug')('blockbrain:service:openhab2');
const edebug = require('debug')('blockbrain:service:openhab2:event');

var host = null;
var updateThingsDelay = 30;

var onThingCreated = null;
var onThingChanged = null;
var onThingRemoved = null;
var onItemCreated = null;
var onItemStateEvent = null;
var onItemStateChangedEvent = null;
var onItemRemoved = null;

var running = false;
var handlerUpdateThings = null;
var busRequest = null;

var things = {};
var items = {};
var links = {};
var channels = {};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  
function config(params) {
    host = params.host || null;
    updateThingsDelay = params.updateThingsDelay || 120;

    onThingCreated = params.onThingCreated || null;
    onThingChanged = params.onThingChanged || null;
    onThingRemoved = params.onThingRemoved || null;
    onItemCreated = params.onItemCreated || null;
    onItemStateEvent = params.onItemStateEvent || null;
    onItemStateChangedEvent = params.onItemStateChangedEvent || null;
    onItemRemoved = params.onItemRemoved || null;
}

async function start() {
    running = true;
    updateThings(false); // Initial thing update. Don't fire updates!
    debug('Start thing update polling');
    handlerUpdateThings = setInterval(updateThings, updateThingsDelay * 1000);
    startEventBus();
    return true;
}

async function stop() {
    debug('OH lib stop');
    running = false;

    if(handlerUpdateThings) {
        debug('Stop thing update polling');
        clearInterval(handlerUpdateThings);
        handlerUpdateThings = null;
    }

    if(busRequest) {
        debug('Stop bus event refresh');
        busRequest.end();
        busRequest = null;
    }
}

async function updateData(fireEvents = true) {
    updateThings.then(() => {
        debug('Things updated');
    }).catch((e) => {
        log.e(`There was an error trying to update OH things`);
        debug(e.message);
        debug(e.stack);
    });
}

async function updateThings(fireEvents = true) {
    debug('Starting thing polling update');

    let data = [];

    let req = http.get(`${host}rest/things`, function(res) {
        res.on('data', (chunk) => { data = [ ...data, ...chunk ]; });
        res.on('end', () => {
            let txtData = (Buffer.from(data)).toString();
            let objData = null;
            try {
                objData = JSON.parse(txtData);
            } catch(e) {
                log.w('Could not parse Openhab2 server thing request. Is Openhab server restarting?');
                return;
            }
            
            let newThings = {};
            let newItems = {};
            let newLinks = {};
            let newChannels = {};

            for(let n = 0; n < objData.length; n++) {
                let obj = objData[n];

                if(!obj.UID) {
                    log.e("Thing received format not recognized!");
                    debug(JSON.stringify(obj));
                } else {
                    let thing = {
                        uid: obj.UID, 
                        label: obj.label, 
                        location: obj.location, 
                        configuration: obj.configuration, 
                        properties: obj.properties, 
                        statusInfo: obj.statusInfo, 
                        channels: {}
                    };

                    if(obj.channels) {
                        for(let c = 0; c < obj.channels.length; c++) {
                            let ch = obj.channels[c];
                            let channel = {
                                thing: thing, 
                                id: ch.id, 
                                uid: ch.uid, 
                                itemType: ch.itemType, 
                                kind: ch.kind, 
                                label: ch.label, 
                                properties: ch.properties, 
                                configuration: ch.configuration, 
                                defaultTags: ch.defaultTags
                            }

                            newChannels[channel.uid] = thing.uid;

                            for(let l = 0; l < ch.linkedItems.length; l++) {
                                newLinks[ch.linkedItems[l]] = {
                                    channel: channel.uid, 
                                    thing: obj.UID
                                }
                            }

                            thing.channels[channel.uid] = channel;
                        }
                    }

                    newThings[obj.UID] = thing;
                }
            }

            if(fireEvents) {
                fireThingEvents({ ...things }, newThings);
                fireItemEvents({ ...items }, newItems);
            }
            things = newThings;
            items = newItems;
            links = newLinks;
            channels = newChannels;

            debug("Thing update complete");
        });
    });

    req.on('error', (err) => {
        log.e("Could not update things from Openhab2 server!");
        if(err.errno == "ECONNREFUSED") {
            debug('Connection refused. Probably Openhab2 server down');
        } else {
            debug("Unknown error: " + JSON.stringify(err));
        }
        if(req)
            req.end();
    });

}

async function startEventBus() {
    while(running) {
        debug('Initiates OH event bus connection');

        let p = new Promise((resolve, reject) => {
            busRequest = http.get(`${host}rest/events`, function(res) {
                res.on('data', function(chunk) {
                    //debug('Incoming event bus data');
                    chunk = (Buffer.from(chunk)).toString('ascii');
                    processEventBuffer(chunk);
                });
                res.on('end', function() {
                    // all data has been downloaded
                    debug('http end event received');
                    resolve(true);
                    busRequest = null;
                });
            });
            busRequest.on('error', function() {
                debug('http error event received');
                reject();
                if(busRequest)
                    busRequest.end();
                busRequest = null;
            });
    });

        await p.then(() => {
            debug('Bus listener finished');

            if(running) {
                log.e('Openhab bus event listener stopped');
            }
        })
        .catch(() => {
            debug('Bus listener ended abruptly');

            if(running)
                log.e('An error occurred during Openhab2 bus event listening. Trying to restart');
        });

        if(running) {
            debug('Waiting for coldstart event bus listener');
            await sleep(10 * 1000); // Wait 10 secs
            if(running)
                log.i('Trying to restart Openhab bus listener');
        }
    }
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
            
            let fireEvent = null;
            let linkedItem = undefined;
            let oldValue = undefined;
            let value = undefined;
            let thingName = null;

            //let matches = null;

            let payload = JSON.parse(data.payload || "{}");

            // From the docs https://www.openhab.org/javadoc/v2.5/org/eclipse/smarthome/core/events/event
            // ChannelTriggeredEvent, ConfigStatusInfoEvent, ExtensionEvent, FirmwareStatusInfoEvent, FirmwareUpdateProgressInfoEvent, FirmwareUpdateResultInfoEvent, GroupItemStateChangedEvent, InboxAddedEvent, InboxRemovedEvent, InboxUpdatedEvent, ItemAddedEvent, ItemChannelLinkAddedEvent, ItemChannelLinkRemovedEvent, ItemCommandEvent, ItemRemovedEvent, ItemStateChangedEvent, ItemStateEvent, ItemStatePredictedEvent, ItemUpdatedEvent, RuleAddedEvent, RuleRemovedEvent, RuleStatusInfoEvent, RuleUpdatedEvent, ThingAddedEvent, ThingRemovedEvent, ThingStatusInfoChangedEvent, ThingStatusInfoEvent, ThingUpdatedEvent
            switch(data.type) {
                // Items ********************************
                case "ItemStateEvent": // {"type":"Decimal","value":"-66"}
                    fireEvent = onItemStateEvent;
                    matches = data.topic.match(/^[^\/]+\/items\/(.*)\/state$/);
                    linkedItem = matches ? matches[1] : false;
                    value = payload.value || undefined;
                    break;

                case "ItemStateChangedEvent": // {"type":"Quantity","value":"0.0 s","oldType":"Quantity","oldValue":"282.0 s"}
                    fireEvent = onItemStateChangedEvent;
                    matches = data.topic.match(/^[^\/]+\/items\/(.*)\/statechanged$/);
                    linkedItem = matches ? matches[1] : false;
                    oldValue = payload.oldValue || undefined;
                    value = payload.value || undefined;
                    break;

                case "ItemAddedEvent": // {"type":"Switch","name":"BbBotSwitch_Ymjcb3q_2DtestSwitch_State","label":"state","tags":[],"groupNames":[]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemChannelLinkAddedEvent": // {"channelUID":"mqtt:homeassistant_6001942ba582:tron:6001942ba582:ESPsensorgaraje_5Fesphome_5Fversion#sensor","configuration":{"profile":"system:default"},"itemName":"GarageVersion"}
                edebug(`[${data.type}] => ${data.topic}`);
                break;

                case "ItemRemovedEvent": // {"type":"Switch","name":"BbBotSwitch_Ymjcb3q_2DtestSwitch_State","label":"state","tags":[],"groupNames":[]}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemCommandEvent": // "topic": "smarthome/items/Blockbrain_Dgvzdf9kzxzpy2vfb2s_2Dsensor2_State/command" // {"type":"OnOff","value":"ON"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "ItemStatePredictedEvent": // "topic": "smarthome/items/Blockbrain_Dgvzdf9kzxzpy2vfb2s_2Dsensor2_State/statepredicted" // {"predictedType":"OnOff","predictedValue":"ON","isConfirmation":false}
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

                case "ThingUpdatedEvent": // Creado canal nuevo, por ejemplo
                edebug(`[${data.type}] => ${data.topic}`);
                break;

                // Inbox ********************************
                case "InboxUpdatedEvent": // {"bridgeUID":"mqtt:systemBroker:tron","flag":"NEW","label":"bbBot (Switch)","properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","topics":["switch/testSwitch"],"vendor":"BlockBrain","basetopic":"homeassistant"},"representationProperty":"objectid","thingUID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                case "InboxRemovedEvent": // {"bridgeUID":"mqtt:systemBroker:tron","flag":"NEW","label":"bbBot (Switch)","properties":{"firmwareVersion":"BlockBrain","modelId":"BlockBrain","topics":["switch/testSwitch"],"vendor":"BlockBrain","basetopic":"homeassistant"},"representationProperty":"objectid","thingUID":"mqtt:homeassistant_ymjcb3q:tron:ymjcb3q","thingTypeUID":"mqtt:homeassistant_ymjcb3q"}
                    edebug(`[${data.type}] => ${data.topic}`);
                    break;

                // Unknown ********************************
                default:
                    log.w(`Cannot manage event ${data.type}`);
                    debug(JSON.stringify(data, null, 2));
                    break;
            }

            if(fireEvent) {
                let thing = undefined;
                let channel = undefined;

                if(!thingName && linkedItem) { // thing referenced by linkedItem?
                    if(linkedItem in links) {
                        if(links[linkedItem].thing in things) {
                            thing = things[links[linkedItem].thing];
                        } else {
                            log.w(`Cannot find thing ${links[linkedItem].thing}`);
                            return;
                        }
                    } else {
                        log.w(`linkedItem ${linkedItem} not found (but should)`);
                        return;
                    }
                } else {
                    // TODO: NOT VERIFIED!!
                    if(thingName) {
                        if(thingName in things) {
                            thing = things[links[linkedItem].thing];
                        } else {
                            log.w(`Cannot find thing ${links[linkedItem].thing}`);
                            return;
                        }
                    }
                }

                if(linkedItem && thing) { // channel identified by linkedItem?
                    if(links[linkedItem].channel in thing.channels) {
                        channel = thing.channels[links[linkedItem].channel];
                    } else {
                        log.w(`Cannot find channel ${links[linkedItem].channel} inside thing ${links[linkedItem].thing}`);
                        return;
                    }
                }

                let params = {
                    thing: channel ? channel.thing : undefined, 
                    channel: channel, 
                    oldValue: oldValue, 
                    value : value
                };

                fireEvent(params);
            }
        }
    });
}

function getChannelByLink(link) {
    console.log('getChannelByLink ' + link);
    if(link in links) {
        console.log(`gCBL thing? ${links[link].thing}`);
        if(links[link].thing in things) {
            let thing = things[links[link].thing];
            console.log(`gCBL channel? ${links[link].channel}`);
            if(links[link].channel in thing.channels) {
                console.log(`gCBL ok`);
                console.dir(thing.channels[links[link].channel]);
                return thing.channels[links[link].channel];
            } else {
                log.w(`Cannot find channel ${links[link].channel} inside thing ${links[link].thing}`);
            }
        } else {
            log.w(`Cannot find thing ${links[link].thing}`);
            //debug(links[link]);
        }
    } else {
        debug(`Link ${link} not found`);
    }

    return null;
}

function fireThingEvents(th, newTh) {
    if(th) {
        Object.keys(th).forEach((tk) => {
            let t = th[tk];
            if((tk in newTh) && newTh[tk]) {
                let nt = newTh[tk];
                // Compare things
                if(!_.isEqual(t, nt)) {
                    debug(`Thing changed ${t.label} [${tk}]`);

                    if(onThingChanged) {
                        debug("Fires onThingChanged");
                        onThingChanged(t, nt);
                    }
                }
            } else {
                // Thing has been removed
                debug(`Thing removed ${t.label} [${tk}]`);

                if(onThingRemoved) {
                    debug("Fires onThingRemoved");
                    onThingRemoved(t);
                }
            }
        });
    }

    if(newTh) {
        Object.keys(newTh).forEach((ntk) => {
            let nt = newTh[ntk];
            if(!(ntk in th) || !th[ntk]) {
                // Thing has been created
                debug(`Thing created ${nt.label} [${ntk}]`);

                if(onThingCreated) {
                    debug("Fires onThingCreated");
                    onThingCreated(nt);
                }
            }
        });
    }
}

function fireItemEvents(it, newIt) {

}

function getThings() {
    return things;
}

function getChannel(channelUid) {
    edebug("ChannelUid " + (channelUid in channels) ? "no" : "" + " existe");
    edebug("channel: " + channelUid);
    edebug(Object.keys(things[channels[channelUid]].channels));
    return (channelUid in channels) ? things[channels[channelUid]].channels[channelUid] : null;
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
    getThings: getThings, 
    getChannel: getChannel, 
    ping: ping, 
    getConfig: getConfig, 
    getInfo: getInfo, 
    getStates: getStates, 
//    tick: tick, 
    setState: setState
}
