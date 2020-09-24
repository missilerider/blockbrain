'use strict';

const snmp = require ("net-snmp");
const pathResolve = require('path').resolve;

const debug = require('debug')('blockbrain:script:snmp');

var store = null;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function config(cfg) {
    store = snmp.createModuleStore();
}

function createSession(host) {
    debug(`Create session to ${host.host}:${host.port || 161}`);
    if('auth' in host) {
        if('version' in host.auth) {
            switch(host.auth.version) {
                case "1":
                    debug("v1");
                    return connect(host, 1, host.auth.community || "public");

                default:
                    log.e(`SNMP version ${host.auth.version} not accepted. Assumed v2c`);
                case "2":
                case "2c":
                    debug("v2c");
                    return connect(host, 2, host.auth.community || "public");

                case "3":
                    debug("v3");
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
        privKey: host.auth.privKey || ""
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
                let ret = [];
                for(let n = 0; n < varbinds.length; n++) {
                    if (varbinds[n].type != snmp.ErrorStatus.NoSuchObject
                            && varbinds[n].type != snmp.ErrorStatus.NoSuchInstance
                            && varbinds[n].type != snmp.ErrorStatus.EndOfMibView) {

                        ret.push(filterVarbind(varbinds[n]));
                    } else {
                        log.e(snmp.ObjectType[varbinds[n].type] + ": " + varbinds[n].oid);
                    }
                }

                if(ret.length < 1) {
                    debug("No valid SNMP reads");
                    reject();
                }

                if(ret.length == 1) {
                    resolve(ret[0]);
                } else {
                    resolve(ret);
                }

                return;
            }
        });
    });
}

async function walkOid(host, oid) {
    return new Promise((resolve, reject) => {
        let session = createSession(host);

        const maxRepetitions = 20;

        var ret = {};

        session.subtree(oid.toString(), maxRepetitions, 
            (varbinds) => {
                debug(`Walked ${varbinds.length} varbinds`);
                for(let n = 0; n < varbinds.length; n++) {
                    if(snmp.isVarbindError(varbinds[n])) {
                        log.e(snmp.ObjectType[varbinds[n].type] + ": " + varbinds[n].oid);
                    } else {
                        ret[varbinds[n].oid] = filterVarbind(varbinds[n]);
                    }
                }


                return;
            }, 
            (error) => {
                debug("Walk finished");
                if(error) {
                    log.e(error.toString());
                    return reject(error);
                } else {
                    if(ret == {}) {
                        debug("No valid SNMP walked");
                        reject("No valid SNMP walked from " + oid);
                    }
        
                    if(ret.length == 0)
                        resolve(ret[0]);
                    else
                        resolve(ret);
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

function filterVarbind(vb) {
    switch(vb.type) {
        case snmp.ObjectType.Boolean:
        case snmp.ObjectType.Integer:
        case snmp.ObjectType.IpAddress:
        case snmp.ObjectType.Counter:
        case snmp.ObjectType.Gauge:
        case snmp.ObjectType.TimeTicks:
        case snmp.ObjectType.Integer32:
        case snmp.ObjectType.Counter32:
        case snmp.ObjectType.Gauge32:
        case snmp.ObjectType.Unsigned32:
        case snmp.ObjectType.Counter64:
        case snmp.ObjectType.Integer:
        case snmp.ObjectType.Integer:
            return vb.value;

        case snmp.ObjectType.OctetString:
        case snmp.ObjectType.Opaque:
            return Buffer.from(vb.value).toString();

        case snmp.ObjectType.Null:
        case snmp.ObjectType.EndOfMibView:
            return null;

        case snmp.ObjectType.NoSuchObject:
        case snmp.ObjectType.NoSuchInstance:
            return undefined;
    }
}

module.exports = {
    config: config, 
    readOid: readOid, 
    walkOid: walkOid, 

    addMib: addMib, 
    listOids: listOids
}
