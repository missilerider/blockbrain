'use strict';

const axios = require('axios');
const debug = require('debug')('blockbrain:service:homeAssistant');

var haHost = "";
var apiToken = "";
var thingChanged = null;

var things = {};

async function doAxios(method, ...params) {
    let ret = await method(...params)
        .then((res) => {
            return res;
        }).catch((e) => {
            log.e(e);
            return { error: "ERROR", data: e }
        });
    
    return ret.data;
}

async function doGetSync(func) {
    return await doAxios(axios.get, `${haHost}/api/${func}`, {
        headers: {
            'Authorization': `Bearer ${apiToken}`, 
            'Content-Type': 'application/json'
        }
    });
}

async function doPostSync(func, data) {
    return await doAxios(axios.post, `${haHost}/api/${func}`, data, {
        headers: {
            'Authorization': `Bearer ${apiToken}`, 
            'Content-Type': 'application/json'
        }
    });
}

module.exports = {
    config: (params) => {
        haHost = params.host;
        apiToken = params.apiToken;
        thingChanged = params.thingChanged;
    }, 

    getEntities: () => {
        return things;
    }, 

    ping: async () => {
        let ret = await doGetSync("");
        return ret.message == 'API running.';
    }, 

    getConfig: async () => {
        let ret = await doGetSync("config");
        if(ret.error) return null;
        return ret.components;
    }, 

    getInfo: async () => {
        let ret = await doGetSync("discovery_info");
        if(!ret.error) return ret;
    }, 

    getStates: async () => {
        let ret = await doGetSync("states");
        if(ret.error) throw(ret.error);
        return ret;
    }, 

    tick: async (self) => {
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
    }, 

    setState: async (entity, newState = null, attributes = null) => {
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
}
