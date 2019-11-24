'use strict';

const slog = global.slog;

let blocks = require('./mqtt.ha.block.defs.lib.js');

module.exports = {
    haSetSensor: {
        "block": function(services) {
            let ret = { ... blocks.blockSetSensorState };
            let srv = services['mqtt'];
            let things = srv.getThings('sensor');
            let thingIds = Object.keys(things);
            let combo = [];
            for(let n = 0; n < thingIds.length; n++) {
                combo.push([ things[thingIds[n]].id, things[thingIds[n]].id ]);
            }
            ret.args0[0].options = combo;
            if(ret.args0[0].options.length == 0)
                ret.args0[0].options = [[
                    "<no sensors>",
                    "___NONE___"
                ]];

            return ret;
        }, 
        "run": async (context) => {
            context.blockIn();
            let sensor = context.getField('SENSOR');
            let srv = context.getService('mqtt');
            let thing = srv.getThing(sensor);
            let value = await context.getValue("VALUE");
            thing.setValue(value);
            slog.d("HA sensor value of " + sensor + " set to " + value);
        }
    }, 
    haSetSwitch: {
        "block": function(services) {
            let ret = { ... blocks.blockSetSwitchState };
            let srv = services['mqtt'];
            let things = srv.getThings('switch');
            let thingIds = Object.keys(things);
            let combo = [];
            for(let n = 0; n < thingIds.length; n++) {
                combo.push([ things[thingIds[n]].id, things[thingIds[n]].id ]);
            }
            ret.args0[0].options = combo;
            if(ret.args0[0].options.length == 0)
                ret.args0[0].options = [[
                    "<no sensors>",
                    "___NONE___"
                ]];

            return ret;
        }, 
        "run": async (context) => {
            context.blockIn();
            let thingName = context.getField('THING');
            let newStatus = context.getField('NEWSTATUS');
            let srv = context.getService('mqtt');
            let thing = srv.getThing(thingName);
            thing.setValue(newStatus !== "off" ? thing.stateOn : thing.stateOff);
            slog.d("HA sensor value of " + thingName + " set to " + newStatus);
        }
    }, 
    haSwitchEvent: {
        "block": function(services) {
            let ret = { ... blocks.blockSwitchEvent };
            let srv = services['mqtt'];
            let things = srv.getThings('switch');
            let thingIds = Object.keys(things);
            let combo = [];
            for(let n = 0; n < thingIds.length; n++) {
                combo.push([ things[thingIds[n]].id, things[thingIds[n]].id ]);
            }
            ret.args0[0].options = combo;
            if(ret.args0[0].options.length == 0)
                ret.args0[0].options = [[
                    "<no sensors>",
                    "___NONE___"
                ]];

            return ret;
        }, 
        "run": async (context) => {
            context.blockIn();
            let thingName = context.getField('THING');
            let thing = context.getVar('msg').thing;
            if(thing.id == thingName) {
                let stateVar = context.getField('VAR');
                context.setVar(stateVar, thing.state);
                context.setVar('msg', {});

                context.continue('CMD');
            }
        }
    }, 
    haThingEnable: {
        "block": function(services) {
            let ret = { ... blocks.blockEnableThing };
            let srv = services['mqtt'];
            let things = srv.getThings();
            let thingIds = Object.keys(things);
            let combo = [];
            for(let n = 0; n < thingIds.length; n++) {
                combo.push([ things[thingIds[n]].id, things[thingIds[n]].id ]);
            }
            ret.args0[1].options = combo;
            if(ret.args0[1].options.length == 0)
                ret.args0[1].options = [[
                    "<no sensors>",
                    "___NONE___"
                ]];

            return ret;
        }, 
        "run": async (context) => {
            context.blockIn();
            let thingName = context.getField('THING');
            let newStatus = context.getField('NEWSTATUS');
            log.dump("newStatus", newStatus);
            let srv = context.getService('mqtt');
            let thing = srv.getThing(thingName);
            if(newStatus != "disable") {
                thing.connect();
                slog.i("HA thing " + thingName + " connected");
            } else {
                thing.disconnect();
                slog.i("HA thing " + thingName + " disconnected");
            }
        }
    }
}
