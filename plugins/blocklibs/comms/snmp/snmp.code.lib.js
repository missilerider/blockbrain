'use strict';

const { isArray } = require('lodash');
const lib = require('./snmp.lib.js');

const debug = require('debug')('blockbrain:script:snmp');

var hosts = null;

const netSnmpAgentOIDs = {
    "1.3.6.1.4.1.8072.3.2.1":       "hpux9", 
    "1.3.6.1.4.1.8072.3.2.2":       "sunos4", 
    "1.3.6.1.4.1.8072.3.2.3":       "solaris", 
    "1.3.6.1.4.1.8072.3.2.4":       "osf", 
    "1.3.6.1.4.1.8072.3.2.5":       "ultrix", 
    "1.3.6.1.4.1.8072.3.2.6":       "hpux10", 
    "1.3.6.1.4.1.8072.3.2.7":       "netbsd", 
    "1.3.6.1.4.1.8072.3.2.8":       "freebsd", 
    "1.3.6.1.4.1.8072.3.2.9":       "irix", 
    "1.3.6.1.4.1.8072.3.2.10":       "linux", 
    "1.3.6.1.4.1.8072.3.2.11":       "bsdi", 
    "1.3.6.1.4.1.8072.3.2.12":       "openbsd", 
    "1.3.6.1.4.1.8072.3.2.13":       "win32", 
    "1.3.6.1.4.1.8072.3.2.14":       "hpux11", 
    "1.3.6.1.4.1.8072.3.2.15":       "aix", 
    "1.3.6.1.4.1.8072.3.2.16":       "macosx",
    "1.3.6.1.4.1.8072.3.2.255":      "unknown", 

    "1.3.6.1.4.1.29671.1":          "cloudController" // Meraki
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
  
function KtoH(KB) {
    if(KB > 1024*1024*1024)
        return (KB / (1024*1024*1024)).toFixed(2) + "TB";

    if(KB > 1024*1024)
        return (KB / (1024*1024)).toFixed(2) + "GB";

    if(KB > 1024)
        return (KB / 1024).toFixed(2) + "MB";

    return parseFloat(KB).toFixed(2) + "KB";
}

var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "A", "B", "C", "D", "E", "F"];

function byteToHex(b) {
    return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
  }

module.exports = {
    config: (params) => {
        hosts = params.hosts;

        lib.config({
            hosts: params.hosts, 
        });
    }, 

    readOid: async (context) => {
        let host = context.getField('HOST');
        let oids = await context.getValue('OID');

        if(!Array.isArray(oids)) oids = [ oids ];

        debug(oids);

        if(!host in hosts) {
            log.e(`Host ${host} could not be found. Review your snmp.hosts.json file`);
            return;
        }

        let ret = "";
        try {
            ret = await lib.readOid(hosts[host], oids);
        } catch(e) {
            return null;
        }
        return ret;
    }, 

    walkOid: async (context) => {
        let host = context.getField('HOST');
        let oid = (await context.getValue('OID')).toString();

        debug("Walk " + oid);

        if(!host in hosts) {
            log.e(`Host ${host} could not be found. Review your snmp.hosts.json file`);
            return;
        }

        let ret = "";
        try {
            ret = await lib.walkOid(hosts[host], oid);
        } catch(e) {
            return null;
        }
        return ret;
    }, 

    systemInfo: async (context) => {
        let host = context.getField('HOST');
        let topic = context.getField('TOPIC');

        debug(`Get system ${topic} from host ${host}`);

        if(!host in hosts) {
            log.e(`Host ${host} could not be found. Review your snmp.hosts.json file`);
            return;
        }

        let session = lib.createSession(hosts[host]);

        let data, id;

        switch(topic) {
            case "INFO":
                data = await lib.readOid(null, [
                    "1.3.6.1.2.1.1.1.0", // desc
                    "1.3.6.1.2.1.1.2.0", // type => netSnmpAgentOIDs
                    "1.3.6.1.2.1.1.3.0", // uptime
                    "1.3.6.1.2.1.1.4.0", // contact
                    "1.3.6.1.2.1.1.5.0", // hostname
                    "1.3.6.1.2.1.1.6.0" // location
                ], session);

                return {
                    hostname: data[4], 
                    description: data[0], 
                    type: netSnmpAgentOIDs[data[1]], 
                    uptime: data[2], 
                    contact: data[3], 
                    location: data[5]
                };

            case "CPU":
                data = await lib.readOid(null, [
                    "1.3.6.1.4.1.2021.10.1.3.1", // load1m
                    "1.3.6.1.4.1.2021.10.1.3.2", // load5m
                    "1.3.6.1.4.1.2021.10.1.3.3", // load15m
                    "1.3.6.1.4.1.2021.11.9.0", // userCpu %
                    "1.3.6.1.4.1.2021.11.10.0", // systemCpu %
                    "1.3.6.1.4.1.2021.11.11.0" // idleCpu %
                ], session);

                return {
                    load1m: data[0], 
                    load5m: data[1], 
                    load15m: data[2], 
                    userCpu: data[3], 
                    systemCpu: data[4], 
                    idleCpu: data[5]
                };

            case "DISK":
                id = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.1", session, 2);
                let mounts = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.2", session, 3);
                let devs = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.3", session, 3);
                let total = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.6", session, 3);
                let available = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.7", session, 3);
                let used = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.9", session, 3);
                let errorFlag = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.100", session, 3);
                let errorMsg = await lib.walkOid(null, "1.3.6.1.4.1.2021.9.1.101", session, 3);

                data = { mount: {}, dev: {} };
                
                for(let n = 0; n < id.length; n++) {
                    let i = id[n].toString();

                    if(i in mounts) {
                        data.mount[mounts[i]] = {
                            dev: devs[i], 
                            used: used[i], 
                            total: KtoH(total[i]), 
                            available: KtoH(available[i]), 
                            totalKB: total[i], 
                            availableKB: available[i], 
                            errorFlag: errorFlag[i] !== 0, 
                            errorMsg: errorMsg[i]
                        }
                    }

                    // Never return tmpfs in data by device
                    if(i in devs && !(["tmpfs"].includes(devs[i]))) {
                        data.dev[devs[i]] = {
                            mount: mounts[i], 
                            used: used[i], 
                            total: KtoH(total[i]), 
                            available: KtoH(available[i]), 
                            totalKB: total[i], 
                            availableKB: available[i], 
                            errorFlag: errorFlag[i] !== 0, 
                            errorMsg: errorMsg[i]
                        }
                    }
                }

                return data;

            case "NETWORK":
                id = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.1", session, 2);
                let desc = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.2", session, 3);
                let type = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.3", session, 3);
                let speed = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.5", session, 3);
                let physAddr = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.6", session, 4);
                let adminStatus = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.7", session, 3);
                let status = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.8", session, 3);
                let inOctets = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.10", session, 3);
                let outOctets = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.16", session, 3);
                let inErrors = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.14", session, 3);
                let outErrors = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.20", session, 3);

                let ipData = await lib.walkOid(null, "1.3.6.1.2.1.4.20.1.2", session, 3);

                data = {};

                for(let n = 0; n < id.length; n++) {
                    let i = id[n].toString();

                    if(i in desc) {
                        data[desc[i]] = {
                            type: type[i], 
                            speed: speed[i], 
                            physAddr: physAddr[i].value.toString('hex'), 
                            adminStatus: adminStatus[i], 
                            status: status[i], 
                            inOctets: inOctets[i], 
                            outOctets: outOctets[i], 
                            inErrors: inErrors[i], 
                            outErrors: outErrors[i]
                        }
                    }
                }

                let ip = Object.keys(ipData);

                for(let n = 0; n < ip.length; n++) {
                    id = ipData[ip[n]].toString();
                    if(id in desc) {
                        let idN = 1;
                        while(("ip" + idN) in data[desc[id]]) idN++;
                        data[desc[id]]["ip" + idN] = ip[n];
                    }
                }

                return data;

            case "NETPERF":
                id = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.1", session, 2);
                let desc2 = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.2", session, 3);
                let inOctets1 = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.10", session, 3);
                let outOctets1 = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.16", session, 3);

                await sleep(5000); // 5 secs

                let inOctets2 = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.10", session, 3);
                let outOctets2 = await lib.walkOid(null, "1.3.6.1.2.1.2.2.1.16", session, 3);

                data = {};

                for(let n = 0; n < id.length; n++) {
                    let i = id[n].toString();

                    if(i in desc2) {
                        data[desc2[i]] = {
                            inMbps: ((((inOctets2[i] - inOctets1[i]) / 5) * 8) / (1024*1024)).toFixed(2), 
                            outMbps: ((((outOctets2[i] - outOctets1[i]) / 5) * 8) / (1024*1024)).toFixed(2), 
                            inBps: Math.round((inOctets2[i] - inOctets1[i]) / 5), 
                            outBps: Math.round((outOctets2[i] - outOctets1[i]) / 5)

                        }
                    }
                }

                return data;
        }
    }

}