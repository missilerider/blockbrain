'use strict';

var fs = require('fs');

function dispatcher(data) {
  data.path.shift(); // "system"
  let blockId = data.path.shift();

  data.blockId = blockId;

  if(data.path.length == 1) { // Local methods: /api/v1/system/XXX
    switch(data.req.method) {
      case "GET":
        switch(data.path[0]) {
          case "health":
            return GEThealth(data);
//          case "POST":
//            return POSTblock(data);
      }
      case "POST":
//        return POSTblock(data);
        break;
    }


    data.res.json({ code: 404 });
    return true;
  } else if(data.path.length > 1) { // /api/v1/system/XXX/XXX
    switch(data.path[0]) {
      case "test": break; // ?? Por ejemplo
    }

    data.res.json({ code: 404 });
    return true;
  }
}

// Retrieve block
function GEThealth(data) {
  data.res.json({
    memory: process.memoryUsage().heapUsed / 1024 / 1024
  });
  return true;
}

// Save block
function POSTblock(data) {
	if(!data.req.body['xml']) {
    sata.res.json({ code: 399 });
    return true;
  }

	var filename = data.config.blocks.path + "/" + data.blockId;
	try {
		fs.writeFileSync(filename + ".xml", data.req.body.xml);
    data.utils.reloadScript(filename + ".xml", data.req.body.xml);
	} catch(e) {
		console.dir(e.message);
		data.res.json({ code: 501, body: { ok: false, error: 1 } });
    return true;
	}
  data.res.json({ code: 200, body: { ok: true } });
  return true;
}

module.exports = {
  dispatcher: dispatcher
}
