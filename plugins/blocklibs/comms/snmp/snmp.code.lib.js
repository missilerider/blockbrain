'use strict';

const { isArray } = require('lodash');
const lib = require('./snmp.lib.js');

const debug = require('debug')('blockbrain:script:snmp');

var hosts = null;

module.exports = {
    config: (params) => {
        hosts = params.hosts;

        lib.config({
            hosts: params.hosts, 
        });
    }, 

    readOids: async (context) => {
        let host = context.getField('HOST');
        let oids = await context.getValue('OID');

        if(!isArray(oids)) oids = [ oids ];

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
    }
}