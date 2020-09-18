'use strict';

const debug = require('debug')('blockbrain:service:mqtt:thing');
const log = global.log;

var mqtt = null;
var mqttSrv = null;

var timer = null;

var timedThings = {};

function startTimer(thing) {
    debug(`Stop timer called from ${thing.id}`);

    // Add thing to update list
    if(!(thing.id in timedThings))
        timedThings[thing.id] = thing;
    
    // Timer not set. Start!
    if(timer === null) {
        debug("Start timer");
        timer = setInterval(() => {
            let keys = Object.keys(timedThings);

            for(let n = 0; n < keys.length; n++) {
                // Self update, please
                timedThings[keys[n]].updateTimer();
            }
        }, 1000);
    }
}

function stopTimer(thing) {
    debug(`Stop timer called from ${thing.id}`);

    if(thing.id in timedThings)
        delete timedThings[thing.id];

    if(Object.keys(timedThings).length == 0 && timer != null) {
        debug("Stop timer");
        clearInterval(timer);
        timer = null;
    }
}

class haThing {
    constructor(params) {
        mqtt = params.mqtt;
        mqttSrv = params.mqttSrv;

        this.id = params.id;
        this.type = this.getType();

        this.value = params.initialState;

        this.device = params.device || "blockbrain";
        this.deviceIdentifier = params.deviceIdentifier;
        this.uniqueId = params.uniqueId;

        this.stateTopic = this.device + "/" + this.type + "/" + this.id + "/state";
        this.availabilityTopic = params.availabilityTopic || this.device + "/status";
        //this.discoveryTopic = params.discoveryTopic;
        this.discoveryTopic = params.discoveryPrefix + "/" + this.getType() + "/" + this.id + "/config", 

        this.stateOnline = params.stateOnline || "online";
        this.stateOffline = params.stateOffline || "offline";
        this.icon = params.icon ? "mdi:" + params.icon : undefined;

        this.initialState = params.initialState;
    }

    toString() { return (this.value || "").toString(); }

    onMessage(topic, msg) {}

    connect() {
        if(!mqtt) {
            log.f("MQTT broker connection not defined. Cannot connect HA thing");
            return;
        }

        if(this.availabilityTopic && this.stateOnline) {
            debug("Starting HA thing " + this.id);
            let ops = {
                qos: 0,
                retain: "TRUE",
                properties: {
                    messageExpiryInterval: 60
                }
            };

            mqtt.publish(this.availabilityTopic, this.stateOnline, ops);
        }

        if(this.initialState && this.stateTopic) {
            let value = JSON.stringify(this.initialState);

            if(value == "[object Object]")
                value = this.initialState.toString();

            debug("HQ thing " + this.id + " initial value " + this.toString() + " @ " + this.stateTopic);
            mqtt.publish(this.stateTopic, this.toString());
        }
    }

    async disconnect() {
        if(this.availabilityTopic && this.stateOffline && mqtt) {
            debug("Stopping HA thing " + this.id);
            let ops = {
                qos: 0,
                retain: "TRUE", 
                properties: {
                    messageExpiryInterval: 60
                }
            };

            debug("HA: " + this.availabilityTopic + ": " + this.stateOffline);

            await mqtt.publish(this.availabilityTopic, this.stateOffline, ops);
            debug("Done!");
        }
    }

    buildDiscovery() {
        let msg = {
            "name": this.id, 
            "unique_id": this.uniqueId, 
            "icon": this.icon || undefined, 
            "state_topic": this.stateTopic, 
            "availability_topic": this.availabilityTopic
    //        "payload_available": "online", 
    //        "payload_not_available": "offline", 
    //        "qos": 0
        };

        if(this.device) {
            msg.device = {
                "identifiers": this.deviceIdentifier, 
                "name": this.device, 
                "model": "BlockBrain", 
                "manufacturer": "BlockBrain", 
                "sw_version": "BlockBrain"
            }
        }

        return msg;
    }

    async discovery() {
        if(!this.discoveryTopic) {
            debug("Cannot set discovery topic for thing " + this.id);
            return;
        }

        let msg = await this.buildDiscovery();

        if(msg) {
            let ops = {
                qos: 0,
                retain: "TRUE",
                properties: {
                messageExpiryInterval: 60
                }
            };
        
            debug(`Creates discovery for thing ${this.id} on '${this.discoveryTopic}'`);
//            debug("MQTT => " + this.discoveryTopic);
//            debug("\t=> " + JSON.stringify(msg, null, 2));
            mqtt.publish(this.discoveryTopic, JSON.stringify(msg), ops);
        } else {
            log.w("Could not create discovery for thing " + this.id);
        }
    }

    subscribe(topic) {
        debug("Subscribe " + topic);
        mqttSrv.addThingSubscription(topic, this);
    }

    async setValue(newValue, retain = false) {
        let value;
        switch(typeof newValue) {
            case "string": value = newValue; break;
            case "number": value = newValue.toString(); break;
            case "boolean": value = newValue ? "TRUE" : "FALSE"; break;
            default: value = JSON.stringify(newValue); break;
        }

        let ops = undefined;

        if(retain) {
            ops = {
                qos: 0,
                retain: "TRUE"
            };
        }

        mqtt.publish(this.stateTopic, this.toString(), ops);
    }
}

class haThing_binary_sensor extends haThing {
    getType() { return "binary_sensor"; }

    constructor(params) {
        super(params);
    }

    buildDiscovery() {
        return super.buildDiscovery();
    }
}

class haThing_switch extends haThing {
    getType() { return "switch"; }

    constructor(params) {
        super(params);

        this.commandTopic = this.device + "/" + this.type + "/" + this.id + "/command";
        this.stateOn = "ON";
        this.stateOff = "OFF";
        this.state = ""; // TODO: Obtener un estado bueno y no esto
    }

    buildDiscovery() {
        let disco = super.buildDiscovery();
        disco.command_topic = this.commandTopic;
        disco.state_on = this.stateOn;
        disco.state_off = this.stateOff;
        disco.payload_on = this.stateOn;
        disco.payload_off = this.stateOff;
        return disco;
    }

    connect() {
        super.connect();

        let that = this;
        this.subscribe(this.commandTopic);
        mqtt.subscribe(this.commandTopic, function() {
            debug("MQTT subscribed to " + that.commandTopic);
          });
      
    }

    disconnect() {
        mqtt.unsubscribe(this.commandTopic);
        debug("MQTT unsubscribed to " + this.commandTopic);
    }

    onMessage(topic, msg) {
        if(topic == this.commandTopic) {
            msg = msg.toString();
            if(msg == this.stateOn || msg == this.stateOff) {
                debug("Changing thing " + this.id + " to state " + msg);
                this.state = msg;
                mqtt.publish(this.stateTopic, msg);
                return 'haSwitchEvent';
            } else {
                log.w("Received wrong payload for sensor " + this.id + " (" + msg + ") where it should be " + this.stateOn + " or " + this.stateOff);
            }
        }
        return false;
    }
}

class haThing_sensor extends haThing {
    getType() { return "sensor"; }

    constructor(params) {
        super(params);
    }

    buildDiscovery() {
        return super.buildDiscovery();
    }
}

class haThing_timer extends haThing {
    getType() { return "sensor"; }

    constructor(params) {
        super(params);

        // Change secs to UTC secs and start timer if needed
        this.setValue(this.value);
    }

    toString() {
        let secs = parseInt(this.value - this.now());

        if(secs > 24*60*60) { // > 1 day
            let days = Math.floor(secs / (24*60*60));
            return days.toString() + "d";
        }

        if(secs > 3600) { // > 1 hour
            let hours = Math.floor(secs / (3600));
            return hours.toString() + "h";
        }

        if(secs > 60) { // > 1 min => 5:13
            return Math.floor(secs / 60) + ":" + ("00" + (secs % 60)).slice(-2);
        }

        if(secs > 0) {
            return Math.max(0, secs).toString() + "s";
        }

        return "stopped";
    }

    buildDiscovery() {
        return super.buildDiscovery();
    }

    now() {
        return Math.round((new Date()).getTime() / 1000);
    }

    remainingSecs() {
        return this.value - this.now();
    }

    // newValue is seconds from now
    async setValue(newValue) {
        debug(`SetValue for ${this.id} = ${newValue}`);
        debug(`now = ${this.now()}`);
        let secs;
        switch(typeof newValue) {
            case "string": secs = parseInt(newValue); break;
            case "number": secs = Math.round(newValue); break;
            case "boolean": secs = 0;
            default: secs = parseInt(newValue.toString()); break;
        }

        if(secs < 0) secs = 0;

        this.value = this.now() + secs;

        this.updateTimer();

        if(secs > 0) startTimer(this);
        else stopTimer(this);

    }

    updateTimer() {
        let secs = this.remainingSecs();

        if(secs <= 0) stopTimer(this);

        mqtt.publish(this.stateTopic, this.toString(), { qos: 0 });
    }
}

module.exports = {
    haThing_binary_sensor: haThing_binary_sensor, 
    haThing_switch: haThing_switch, 
    haThing_sensor: haThing_sensor,
    haThing_timer: haThing_timer
};