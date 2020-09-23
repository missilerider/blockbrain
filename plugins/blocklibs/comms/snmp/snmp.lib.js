'use strict';

const snmp = require ("net-snmp");
const pathResolve = require('path').resolve;

const debug = require('debug')('blockbrain:service:snmp');

var store = null;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function config(cfg) {
    store = snmp.createModuleStore();
}

function createSession(host) {
    if('auth' in host) {
        if('version' in host.auth) {
            switch(host.auth.version) {
                case "1":
                    return connect(host, 1, host.auth.community || "public");

                default:
                case "2":
                case "2c":
                    return connect(host, 2, host.auth.community || "public");

                case "3":
                    return connectV3(host);
                }
        }
    }
}

function connect(host, version, community) {
    var options = {
        port: host.port || 161,
        retries: 1,
        timeout: 2000,
        backoff: 1.0,
        transport: "udp4",
        trapPort: host.trapPort || (host.port ? host.port + 1 : 162),
        version: version == 2 ? snmp.Version2c : snmp.Version1,
        idBitsSize: 32,
    };

    return snmp.createSession (host.host, community, options);
}

function connectV3(host, auth) {
    var options = {
        port: host.port || 161,
        retries: 1,
        timeout: 2000,
        transport: "udp4",
        trapPort: host.trapPort || (host.port ? host.port + 1 : 162),
        version: snmp.Version3,
        idBitsSize: 32,
        context: ""
    };

    var user = {
        name: host.auth.user,
        level: null,
        authProtocol: undefined,
        authKey: host.auth.authKey,
        privProtocol: undefined,
        privKey: "privycouncil"
    };

    switch(host.auth.security) {
        default:
            log.w("SNMP security incorrectly defined for v3. Expected authNoPriv or noAuthNoPriv or authPriv. Defaults to authNoPriv");
        case "authNoPriv": user.level = snmp.SecurityLevel.authNoPriv; break;
        case "noAuthNoPriv": user.level = snmp.SecurityLevel.noAuthNoPriv; break;
        case "authPriv": user.level = snmp.SecurityLevel.authPriv; break;
    }

    switch(host.auth.authProtocol) {
        default:
            log.w("SNMP authProtocol incorrectly defined for v3. Expected md5 or sha. Defaults to md5");
        case "md5": user.authProtocol = snmp.AuthProtocols.md5; break;
        case "sha": user.authProtocol = snmp.AuthProtocols.sha; break;
    }

    switch(host.auth.privProtocol) {
        default:
            log.w("SNMP authProtocol incorrectly defined for v3. Expected sha or des. Defaults to des");
        case "des": user.privProtocol = snmp.PrivProtocols.des; break;
        case "aes": user.privProtocol = snmp.PrivProtocols.aes; break;
    }

    return snmp.createV3Session(host.host, user, options);
}

async function readOid(host, oids) {
    return new Promise((resolve, reject) => {
        let session = createSession(host);
        session.get(oids, (error, varbinds) => {
            if (error) {
                console.error (error.toString ());
                return reject(error);
            } else {
                if (varbinds[0].type != snmp.ErrorStatus.NoSuchObject
                        && varbinds[0].type != snmp.ErrorStatus.NoSuchInstance
                        && varbinds[0].type != snmp.ErrorStatus.EndOfMibView) {

                    resolve(Buffer.from(varbinds[0].value).toString());
                } else {
                    console.error (snmp.ObjectType[varbinds[0].type] + ": "
                            + varbinds[0].oid);
                    reject();
                }
            }
        });
    });
}

function addMib(mibFile) {
    store.loadFromFile(pathResolve(mibFile));
}

function listOids() {
    let ret = {};
    let libs = Object.keys(store.parser.Modules);
    for(let n = 0; n < libs.length; n++) {
        var data = store.getModule(libs[n]);

        let oids = {};

        let subs = Object.keys(data);
        for(let m = 0; m < subs.length; m++) {
            if('OID' in data[subs[m]]) {
                oids[subs[m]] = data[subs[m]].OID;
            }
        }

        if(Object.keys(oids).length > 0)
            ret[libs[n]] = oids;
    }

    return ret;    
}

module.exports = {
    config: config, 
    readOid: readOid, 

    addMib: addMib, 
    listOids: listOids
}
