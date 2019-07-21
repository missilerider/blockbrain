'use strict';

var fs = require('fs');

function dispatcher(data) {
  data.path.shift(); // "services"
  if(data.path.length < 1) { // Operation over "services"
    switch(data.req.method) {
      case "GET":
        return GETservices(data);
    }
  } else {
    let serviceId = data.path.shift();
    data.serviceId = serviceId;

    if(data.path.length < 1) { // Local methods: /api/v1/services/[serviceId]
      switch(data.req.method) {
        case "GET":
          return GETservicesId(data);
        case "POST":
          return POSTservicesId(data);
      }

      data.res.json({ code: 404 });
      return true;
    } else { // /api/v1/services/[serviceId]/method...
      switch(data.path[0]) {
        case "test": break; // ?? Por ejemplo
      }

      data.res.json({ code: 404 });
      return true;
    }
  }
}

function GETservices(data) {
  var ret = {};
  var srvs = data.plugins.getServices(data.config);
  console.dir(srvs);
  let srvIds = Object.keys(srvs);
  for(let n = 0; n < srvIds.length; n++) {
    let srv = srvs[srvIds[n]];
    let info = srv.getInfo();

    let status = data.plugins.getServiceStatus(info.name);

    ret[srvIds[n]] = {
      name: info.name,
      description: info.description,
      methods: info.methods.filter(value => ["start", "stop", "restart"].includes(value)),
      status: status
    }
  }
  data.res.json(ret);
  return true;
}

function GETservicesId(data) {
  data.res.json({code:503, msg: 'Not implemented'});
}

function POSTservicesId(data) {
  data.res.json({code:503, msg: 'Not implemented'});
}

module.exports = {
  dispatcher: dispatcher
}
