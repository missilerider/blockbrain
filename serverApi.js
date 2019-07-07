'use strict';

var fs = require('fs');
const log = global.log;

var conf;

function config(config) {
  conf = config;
}

function GETblock(path, query) {
  if(path.length < 1) return { code: 404 }; // BlockID unspecified
  var id = path[0];

  var filename = conf.blocks.path + "/" + id + ".xml";
	console.log(filename);
  if(fs.existsSync(filename)) {
    var data = fs.readFileSync(filename, "utf8");
    return { code: 200, type: "application/xml; charset=utf-8", body: data };
  } else {
    return { code: 404 }
  }
}

function POSTblock(path, query, body) {
  if(path.length < 1) return { code: 404 }; // BlockID unspecified
  var id = path[0];

	if(!body['xml']) return { code: 399 };

	var filename = conf.blocks.path + "/" + id;
	try {
		console.log("#" + filename + "#");
		fs.writeFileSync(filename + ".xml", body.xml);
//		fs.writeFileSync(filename + ".js", body.js);
	} catch(e) {
		console.dir(e.message);
		return { code: 501, body: { ok: false, error: 1 } };
	}
  return { code: 200, body: { ok: true } };
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
  GET: {
    block: GETblock,
    local: GETlocal,
    ping: GETping
  },
  POST: {
    block: POSTblock
  }
};
