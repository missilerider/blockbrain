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

module.exports = {
  dispatcher: dispatcher
}
