'use strict';

var fs = require('fs');

function dispatcher(data) {
  data.path.shift(); // "block"
  let blockId = data.path.shift();

  data.blockId = blockId;

  if(data.path.length < 1) { // Local methods: /api/v1/blocks/[blockId]
    switch(data.req.method) {
      case "GET":
        return GETblock(data);
      case "POST":
        return POSTblock(data);
    }

    data.res.json({ code: 404 });
    return true;
  } else { // /api/v1/blocks/[blockId]/method...
    switch(data.path[0]) {
      case "test": break; // ?? Por ejemplo
    }

    data.res.json({ code: 404 });
    return true;
  }
}

function GETblock(data) {
  var filename = data.config.blocks.path + "/" + data.blockId + ".xml";
  if(fs.existsSync(filename)) {
    var block = fs.readFileSync(filename, "utf8");
    data.preparexml();
    data.res.send(block);
  } else {
    data.res.json({ code: 404 });
  }
  return true;
}

function POSTblock(data) {
	if(!data.req.body['xml']) {
    sata.res.json({ code: 399 });
    return true;
  }

	var filename = data.config.blocks.path + "/" + data.blockId;
	try {
		console.log("#" + filename + "#");
		fs.writeFileSync(filename + ".xml", data.req.body.xml);

    //data.utils.reloadScript(filename + ".xml", data.req.body.xml);
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
