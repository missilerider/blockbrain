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
      "bind": "0.0.0.0",
      "path": "msg"
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
      "disableCache": false
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

  return conf;
}

function loadServiceConfig(srvName) {
  try {
    return JSON.parse(fs.readFileSync('config/services/' + srvName + '.json'));
  } catch {}
  return {};
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
  console.dir(eventIndex);
  res.json({"result":"OK"});
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
  log.d("Reads script file " + fileReal);
  return fs.readFileSync(fileReal);
}

// Rebuilds script root node references
function buildScriptRefs(file) {
  clearEventRef(file);

  let inserted = {};

  let json = getScript(file);

  if(!("block" in json.xml) || !(Array.isArray(json.xml.block))) {
    log.w("Cannot refresh contents of an empty or faulty block in " + file);
    return false;
  } else {
    json.xml.block.forEach((b) => {
      if(!(b.type in inserted)) {
        inserted[b.type] = true; // Don't insert twice

        if(!(b.type in eventIndex)) // If event does not exist
          eventIndex[b.type] = [];

        eventIndex[b.type].push(file);
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
  let json = JSON.parse(xml2json.toJson(xml, { reversible: false, trim: false }));

  if(!currentConfig.system.disableCache) {
    scriptCache[file] = json;
    buildScriptRefs(file);
  }

  return json;
}

async function scriptReload(dirname) {
  var files = fs.readdirSync(dirname);

  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    //files.forEach(async function (file, index) {
    var file = files[fk[fn]];
    var fromPath = dirname + '/' + file;

    var stat = fs.statSync(fromPath);

    if(stat.isFile() && fromPath.match(/.*\.xml/)) {
      buildScriptRefs(fromPath);
    } else if(stat.isDirectory()) {
      scriptReload(fromPath);
    }
  }

  console.dir(eventIndex);
  console.dir(Object.keys(scriptCache));
}

module.exports = {
  config: config,
  loadConfig: loadConfig,
  loadServiceConfig: loadServiceConfig,
  saveStartupServices: saveStartupServices,
  login: login,
  sha256: sha256,
  stringify: stringify,
  endpoint: endpoint,
  buildScriptRefs: buildScriptRefs,
  getScript: getScript,
  scriptReload: scriptReload
};
