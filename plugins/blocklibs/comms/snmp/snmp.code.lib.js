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
    }

}