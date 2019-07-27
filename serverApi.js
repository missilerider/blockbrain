'use strict';

var fs = require('fs');
const log = global.log;

var blocks = require('./serverApi/blocks.js');
var services = require('./serverApi/services.js');

var conf;
var plugins;
var srv;

function config(params) {
  conf = params.config;
  plugins = params.plugins;
  srv = params.services;
}

async function _dispatcher(req, res, next) {
  ret = await dispatcher(req, res, next);

  res.type('application/json');

  res.json(ret);
}

async function dispatcher(req, res, next) {
  log.d("API: " + req.method + " " + req._parsedUrl.pathname);
  var path = req._parsedUrl.pathname.split("/");
  path.shift(); // ""
  path.shift(); // "api"
  path.shift(); // "v1"

  res.type('application/json');

  if(path.length < 1) {
    res.json({ code: 404 });
    return;
  }

  let data = {
    preparexml: () => { res.type("application/xml; charset=utf-8"); },
    sleep: (milliseconds) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) }, 
    req: req,
    res: res,
    next: next,
    config: conf,
    plugins: plugins,
    services: srv,
    path: path
  }

  switch(path[0]) {
    case "blocks": return blocks.dispatcher(data);
    case "services": return services.dispatcher(data);
  }

  res.json({ code: 404 });
}



function GETlocal(path, query) {
  return { code: 400, body: "Funcion GETlocal no definida" };
}

function GETping(path, query) {
  return {
    code: 202, // Accepted
    type: "application/json",
    headers: {
      h1: "h2",
      h3: "h4"
    },
    body: {
      path: path,
      query: query
    }
  };
}

module.exports = {
  config: config,
  dispatcher: dispatcher,
};
