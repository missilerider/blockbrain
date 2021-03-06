'use strict';

const debug = require('debug')('blockbrain:server');

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

    let srvs = data.services.getServices(data.config);

    if(!(data.serviceId in srvs)) {
      data.res.json({ code: 404 });
      return true;
    }

    data.service = srvs[data.serviceId];

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
      switch(data.req.method) {
        case "GET":
          switch(data.path[0]) {
            case "start": return GETservicesIdStart(data);
            case "stop": return GETservicesIdStop(data);
            case "restart": return GETservicesIdRestart(data);
          }
          break;

        case "POST":
          switch(data.path[0]) {
            case "settings": return POSTservicesIdSettings(data);
          }
      }

      log.e("Service API incorrectly called: " + data.path[0]);
      data.res.json({ code: 404 });
      return true;
    }
  }
}

function GETservices(data) {
  var ret = {};
  var srvs = data.services.getServices(data.config);
  let srvIds = Object.keys(srvs);

  for(let n = 0; n < srvIds.length; n++) {
    let srvName = srvIds[n];
    let srv = srvs[srvName];

    ret[srvIds[n]] = describeService(data, srvIds[n], srv);
  }

  debug("GET services" + JSON.stringify(ret));
  data.res.json(ret);
  return true;
}

function describeService(data, serviceName, service, extended = false) {
  debug(`describeService ${serviceName}`);
  let info = service.getInfo();
  let status = data.services.status(serviceName, extended);

  return {
    id: serviceName,
    name: info.name,
    description: info.description,
    methods: info.methods.filter(value => ["start", "stop", "restart", "settings"].includes(value)),
    status: status,
    startOnBoot: (serviceName in data.config.startupServices ? data.config.startupServices[serviceName] : false)
  }
}

function GETservicesId(data) {
  debug(`Describe complete service ${data.serviceId}`);
  var ret = describeService(data, data.serviceId, data.service, true);

  var template = data.services.settingsTemplate(data.serviceId);

  ret.template = template;

  debug(ret);
  data.res.json(ret);
  return true;
}

function POSTservicesId(data) {
  debug("POST body" + JSON.stringify(data.req.body));
  Object.keys(data.req.body).forEach((id) => {
    debug("Check " + id);
    switch(id) {
      case "startOnBoot": data.services.setStartOnBoot(data.serviceId, data.req.body[id] ? true : false); break;
    }
  });
  data.res.json({result: "OK"});
}

async function GETservicesIdStart(data) {
  debug(`Service ${data.serviceId} start`);
  data.services.start(data.serviceId);
  if(data.services.waitForStatusSync(data.serviceId, 1, 5000)) {
    await data.sleep(100);
    data.res.json({
      result: "OK",
      service: describeService(data, data.serviceId, data.service)
    });
  } else
    data.res.json({
      result: "KO",
      service: describeService(data, data.serviceId, data.service)
    });
}

async function GETservicesIdStop(data) {
  debug(`Service ${data.serviceId} stop`);
  data.services.stop(data.serviceId);
  if(data.services.waitForStatusSync(data.serviceId, 0, 5000)) {
    await data.sleep(100);
    data.res.json({
      result: "OK",
      service: describeService(data, data.serviceId, data.service)
    });
  } else
    data.res.json({
      result: "KO",
      service: describeService(data, data.serviceId, data.service)
    });
}

async function GETservicesIdRestart(data) {
  debug(`Service ${data.serviceId} restart`);
  data.services.stop(data.serviceId, () => {
    return GETservicesIdStart(data);
  });
}

async function POSTservicesIdSettings(data) {
  debug(`Service ${data.serviceId} settings apply`);
  data.res.json(data.services.applySettings(data.serviceId, data.req.body));
}

module.exports = {
  dispatcher: dispatcher
}
