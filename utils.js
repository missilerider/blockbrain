'use strict';

const crypto = require('crypto');
const fs = require('fs');
const xml2json = require('xml2json');

const log = global.log;

var currentConfig;
var plugins;
var services;

var eventIndex = {};
var scriptCache = {};

function config(params) {
  currentConfig = params.config;
  plugins = params.plugins;
  services = params.services;
}

function loadConfig() {
  var defaultConf = {
    "endpoint": {
      "port": 80,
      "bind": "0.0.0.0"
    },
    "blocks": {
      "path": "./vault"
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
      "helpUrl": "/help",
      "useCache": true
    }
  };

  var defaultStartupServices = {
    "importantService": false
  }


  var userConf = JSON.parse(fs.readFileSync('config/blockbrain.json'));

  var userStartupServices = JSON.parse(fs.readFileSync('config/startupServices.json'));

  var conf = Object.assign(defaultConf, userConf);
  conf.startupServices = Object.assign(defaultStartupServices, userStartupServices);

  if(conf.security && conf.security.users)
    conf.security.users.forEach(function (u) {
      if(!u.hasOwnProperty("sha256"))
        u.sha256 = sha256(u.password);
      });

  currentConfig = conf;

  console.dir(conf);

  return conf;
}

function saveStartupServices(startupServices) {
  fs.writeFileSync('config/startupServices.json', JSON.stringify(startupServices));
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

function endpoint(req, res, next) {
  console.dir(Object.keys(req));
  console.dir(req.body);
  plugins;
  res.json('{"result":"OK"}');
}

function clearEventRef(file) {
  let ids = Object.keys(eventIndex);
  for(let n = 0; n < ids; n++) {
    eventIndex[ids[n]] = eventIndex[ids[n]].filter(v => v != file);
  }
}

function clearEventRef(file) {
  let ids = Object.keys(eventIndex);
  for(let n = 0; n < ids; n++) {
    eventIndex[ids[n]] = eventIndex[ids[n]].filter(v => v != file);
  }
}

function loadScript(file) {
  let fileReal = fs.realpathSync(file);
  return fs.readfileSync(fileReal);
}

function reloadScript(file, xml = null) {
  if(xml == null) {
    xml = loadScript(file);
  }

  if(currentConfig.system.useCache) {
    scriptCache[file] = xml;
  }

  clearEventRef(file);

  let json = JSON.parse(xml2json.toJson(xml, { reversible: false, trim: false }));
  if(!("block" in json.xml)) {
    log.w("Cannot refresh contents of an empty or faulty block");
  } else {
    json.xml.block.forEach((b) => {

      console.dir(b);

    });
  }

  console.dir(Object.keys(scriptCache));
}

function getScript(file) {
  if(file in scriptCache)
    return scriptCache;

  let xml = loadScript(file);

  if(currentConfig.system.useCache) {
    scriptCache[file] = xml;
  }

  return xml;
}

module.exports = {
  config: config,
  loadConfig: loadConfig,
  saveStartupServices: saveStartupServices,
  login: login,
  sha256: sha256,
  stringify: stringify,
  endpoint: endpoint,
  reloadScript: reloadScript,
  getScript: getScript
};
