'use strict';

const crypto = require('crypto');
const log = global.log;

var currentConfig;

function loadConfig() {
  var conf = {
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

  if(conf.security && conf.security.users)
    conf.security.users.forEach(function (u) {
      if(!u.hasOwnProperty("sha256"))
        u.sha256 = sha256(u.password);
      });

  currentConfig = conf;

  return conf;
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

module.exports = {
  loadConfig: loadConfig,
  login: login,
  sha256: sha256,
  stringify: stringify
};
