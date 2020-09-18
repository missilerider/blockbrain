'use strict';

const snmp = require ("net-snmp");
const debug = require('debug')('blockbrain:service:snmp');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function connectV2(host, community) {

}

function connectV3(host, auth, options) {
    var options = {
        port: 161,
        retries: 1,
        timeout: 5000,
        transport: "udp4",
        trapPort: 162,
        version: snmp.Version3,
        idBitsSize: 32,
        context: ""
    };

    var user = {
        name: auth.user,
        level: snmp.SecurityLevel.authPriv,
        authProtocol: snmp.AuthProtocols.sha,
        authKey: "madeahash",
        privProtocol: snmp.PrivProtocols.des,
        privKey: "privycouncil"
    };

    switch(auth.security) {
        default:
            log.w("SNMP security incorrectly defined for v3. Expected authNoPriv or noAuthNoPriv or authPriv. Defaults to authNoPriv");
        case "authNoPriv": user.level = snmp.SecurityLevel.authNoPriv; break;
        case "noAuthNoPriv": user.level = snmp.SecurityLevel.noAuthNoPriv; break;
        case "authPriv": user.level = snmp.SecurityLevel.authPriv; break;
    }

    return snmp.createV3Session(host, user, options);
}

function readOid(session, oids) {

}

module.exports = {
    config: config, 
    start: start, 
    stop: stop, 
    getThings: getThings, 
    getChannel: getChannel, 
//    ping: ping, 
//    getConfig: getConfig, 
//    getInfo: getInfo, 
//    getStates: getStates, 
//    tick: tick, 
//    setState: setState
}
