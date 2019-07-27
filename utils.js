'use strict';

const crypto = require('crypto');
const fs = require('fs');
const log = global.log;

var currentConfig;
var plugins;
var services;

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
      "helpUrl": "/help"
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

module.exports = {
  config: config,
  loadConfig: loadConfig,
  saveStartupServices: saveStartupServices,
  login: login,
  sha256: sha256,
  stringify: stringify,
  endpoint: endpoint
};
