'use strict';

const swVersion = 0.1;

const crypto = require('crypto');
const fs = require('fs');
const xml_js = require('xml-js');
const executor = require('./executor.js');

const debug = require('debug')('blockbrain');
const log = global.log;

var currentConfig;
var plugins;
var services;

var eventIndex = {};
var scriptCache = {};

// Helpers for variable copying where needed (references have to be always killed) and "undefined" and "null" managed accordingly
function getThis() { return this; }
Number.prototype.getValue = getThis;
String.prototype.getValue = getThis;
Boolean.prototype.getValue = getThis;
Object.prototype.getValue = function() {
  let ret = {};
  let ids = Object.keys(this);
  for(let n = 0; n < ids.length; n++) { ret[ids[n]] = this[ids[n]] ? this[ids[n]].getValue() : this[ids[n]]; }
  return ret;
}
Array.prototype.getValue = function() {
  let ret = [];
  for(let n = 0; n < this.length; n++) { ret[n] = this[n] ? this[n].getValue() : this[n]; }
  return ret;
}

function config(params) {
  currentConfig = params.config;
  plugins = params.plugins;
  services = params.services;

  executor.config(params);
}

function loadConfig() {
  var defaultConf = {
    "endpoint": {
      "port": 80,
      "bind": "0.0.0.0",
      "path": "msg"
    },
    "blocks": {
      "path": global.vault_path
    },
    "security": {
      "cookie": {
        "secret": "veryZZzecret0rl",
        "name": "sessionId"
      },
      "users": [
        { "name": "test", "password": "test" },
        { "name": "test2", "sha256": "60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752" }
      ]
    },
    "system": {
      "version": swVersion, 
      "helpUrl": "/help",
      "disableCache": false,
      "log": {
        "level": "ERROR", 
        "stdout": true
      }, 
      "log": {
        "level": "ERROR", 
        "stdout": true
      }
    }, 
    "homeAssistant": {
      "enabled": false, 
      "discovery": {
        "enabled": true, 
        "renewalMins": 60
      }, 
      "items": {
/*        "binary_sensor": {
          "sample_sensor": {
            "class": "window"
          }
        }, 
        "switch":{
          "test_switch": {
            "icon": "mdi-spider" // https://cdn.materialdesignicons.com/4.5.95/
          }
        }*/
      }
    }
  };

  var defaultStartupServices = {
    "keyValue": true
  }

  debug(`Load config from ${global.config_path}/blockbrain.json`);
  var userConf = JSON.parse(fs.readFileSync(`${global.config_path}/blockbrain.json`));

  debug(`Load userStartupServices from ${global.config_path}/blockbrain.json`);
  var userStartupServices = JSON.parse(fs.readFileSync(`${global.config_path}/startupServices.json`));

  var conf = Object.assign(defaultConf, userConf);
  conf.startupServices = Object.assign(defaultStartupServices, userStartupServices);

  if(conf.security && conf.security.users)
    conf.security.users.forEach(function (u) {
      if(!u.hasOwnProperty("sha256"))
        u.sha256 = sha256(u.password);
      });

  currentConfig = conf;

  global.blockbrainVersion = conf.system.swVersion;

  return conf;
}

function loadServiceConfig(srvName) {
  try {
    debug(`Load ServiceConfig ${srvName} from ${global.config_path}/services/${srvName}.json`);

    return JSON.parse(fs.readFileSync(`${global.config_path}/services/${srvName}.json`));
  } catch (e) {
    log.e(`Could not load config. ${e.message}`);
  }
  return {};
}

function saveServiceConfig(srvName, config) {
  try {
    debug(`Save ServiceConfig ${srvName} to ${global.config_path}/services/${srvName}.json`);

    return fs.writeFileSync(`${global.config_path}/services/${srvName}.json`, JSON.stringify(config, null, 2));
  } catch (e) {
    log.e(`Could not save config. ${e.message}`);
  }
  return {};
}

function loadServiceAdditionalConfig(srvName, fileId) {
  try {
    debug(`Load ServiceAdditionalConfig ${srvName}.${fileId} from ${global.config_path}/services/${srvName}.${fileId}.json`);

    return JSON.parse(fs.readFileSync(`${global.config_path}/services/${srvName}.${fileId}.json`));
  } catch (e) {
    log.e(`Could not load additional service config file ${global.config_path}/services/${srvName}.${fileId}.json`);
    log.e(e.message);
  }
  return null;
}

function saveServiceAdditionalConfig(srvName, fileId, data) {
  try {
    debug(`Save ServiceAdditionalConfig ${srvName}.${fileId} from ${global.config_path}/services/${srvName}.${fileId}.json`);

    fs.writeFileSync(`${global.config_path}/services/${srvName}.${fileId}.json`, JSON.stringify(data, null, 2), 'utf8');

    return true;
  } catch (e) {
    log.e(`Could not save additional service config file ${global.config_path}/services/${srvName}.${fileId}.json`);
    log.e(e.message);
    return false;
  }
}

function saveStartupServices(startupServices) {
  fs.writeFileSync(`${global.config_path}/startupServices.json`, JSON.stringify(startupServices, null, 2));
}

function login(req, res) {

}

function sha256(txt) { return crypto.createHash('sha256').update('test2').digest('hex'); }

function stringify(o, depth = 1) {
  if(o === null) return null;

  switch(typeof o) {
    case "string":
    case "boolean":
    case "number":
      return o;

    case "object":
      if(depth < 1) return "[object]";

      var ret = {};
      var keys = Object.keys(o);
      for(var n = 0; n < keys.length; n++)
        ret[keys[n]] = stringify(o[keys[n]], depth - 1);
      return ret;

    default:
      return "[" + (typeof o) + "]";
  }
}

async function endpoint(req, res, next) {
  debug("Endpoint request");

  let ret = await executeEvent('http_endpoint', req.body);

  ret = ret.filter(r => r != null);

  if(ret.length > 1)
    res.json(ret);
  else if(ret.length == 1)
    res.json(ret[0]);
  else
    res.json({});
}

async function executeEvent(eventName, vars, params = undefined) {
  let proms = [];
  if(eventName in eventIndex) {
    for(let n = 0; n < eventIndex[eventName].length; n++) {
      let script = eventIndex[eventName][n];
      let json = getScript(script);
      debug("Execute " + eventName + " from " + script);
      proms = proms.concat(await executor.executeProgramJson(json, {
        nodeTypeFilter: eventName,
        msg: vars
      }, params));
    }

    let ret = await Promise.all(proms).then(ret => {
      return ret;
    });

    return ret;
  } else {
    return null;
  }
}

async function executeEventLike(eventRegex, vars) {
  let proms = [];
  let indexes = Object.keys(eventIndex);
  for(let n = 0; n < indexes.length; n++) {
    if(indexes[n].toString().match(eventRegex)) {
      let eventName = eventIndex[indexes[n]];
      debug("Execution of " + eventName + " in files:");
      for(let n = 0; n < eventIndex[eventName].length; n++) {
        let script = eventIndex[eventName][n];
        let json = getScript(script);
        debug("Execute " + eventName + " from " + script);
        proms = proms.concat(await executor.executeProgramJson(json, {
          nodeTypeFilter: eventName,
          msg: vars
        }));
      }
    }
  }

  if(proms.length == 0) return null;

  let ret = await Promise.all(proms).then(ret => {
    return ret;
  });

  return ret;
}

function clearEventRef(file) {
  let ids = Object.keys(eventIndex);
  for(let n = 0; n < ids.length; n++) {
    eventIndex[ids[n]] = eventIndex[ids[n]].filter(v => v != file);
  }
}

// Returns file contents
function loadScript(file) {
  let fileReal = fs.realpathSync(file);
  debug("Reads script file " + fileReal);
  return fs.readFileSync(fileReal);
}

// Rebuilds script root node references
function buildScriptRefs(file) {
  debug("buildScriptRefs " + file);
  clearEventRef(file);

  let inserted = {};

  delete scriptCache[file];

  let json = getScript(file);

  if(!("block" in json.xml)) {
    log.w("Cannot refresh contents of an empty or faulty block in " + file);
    return false;
  } else {
    if(!Array.isArray(json.xml.block))
      json.xml.block = [json.xml.block];
    json.xml.block.forEach((b) => {
      if(!(b._attributes.type in inserted)) {
        inserted[b._attributes.type] = true; // Don't insert twice

        if(!(b._attributes.type in eventIndex)) // If event does not exist
          eventIndex[b._attributes.type] = [];

        eventIndex[b._attributes.type].push(file);
      }
    });
  }

  return true;
}

// Returns json script and caches if needed
function getScript(file) {
  if(!currentConfig.system.disableCache) {
    if(file in scriptCache)
      return scriptCache[file];
  }

  let xml = loadScript(file);
  let json = JSON.parse(xml_js.xml2json(xml, { compact: true, spaces: 4, trim: false, captureSpacesBetweenElements: true }));

    if(!currentConfig.system.disableCache) {
    scriptCache[file] = json;
    //buildScriptRefs(file);
  }

  return json;
}

async function scriptReload(dirname) {
  debug("scriptReload " + dirname);
  var files = fs.readdirSync(dirname);

  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    //files.forEach(async function (file, index) {
    var file = files[fk[fn]];
    var fromPath = dirname + '/' + file;

    var stat = fs.statSync(fromPath);

    if(stat.isFile() && fromPath.match(/.*\.xml$/)) {
      buildScriptRefs(fromPath);
      //getScript(fromPath);
    } else if(stat.isDirectory()) {
      scriptReload(fromPath);
    }
  }
}

module.exports = {
  config: config, 
  loadConfig: loadConfig, 
  loadServiceConfig: loadServiceConfig, 
  saveServiceConfig: saveServiceConfig, 
  loadServiceAdditionalConfig: loadServiceAdditionalConfig, 
  saveServiceAdditionalConfig: saveServiceAdditionalConfig, 
  saveStartupServices: saveStartupServices, 
  login: login, 
  sha256: sha256, 
  stringify: stringify, 
  endpoint: endpoint, 
  executeEvent: executeEvent, 
  executeEventLike: executeEventLike, 
  buildScriptRefs: buildScriptRefs, 
  getScript: getScript, 
  scriptReload: scriptReload
};
