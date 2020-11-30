const server = require('./blockremote.server.lib');
const ca = require('../../../../ca.js');
const qr = require('qr-image');

//const blockCode = require('./blockremote.code.lib.js');
//const blocks = require('./blockremote.blocks.lib.js');
const debug = require('debug')('blockbrain:service:blockremote');

const log = global.log;

var utils = null; // Set at "start" from service "commonTools"

var runPromise = null;
var runPromiseResolve = null;

var serviceConfig = null;

var otpCodes = {};

function getQr_svg(req, res) {
  const chars = 'abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMNOPQRRSTUVWXYZ0123456789';

  let otp = '';
  for(let n = 0; n < 16; n++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }

  otp = '1234';

  otpCodes[otp] = setTimeout(() => {
    delete otpCodes[otp];
    debug("Removing OTP " + otp);
  }, (serviceConfig.otpSeconds || 60) * 1000 );

  const cfg = utils.loadConfig();

  let domains = cfg.endpoint.domainName || [];
  if(!Array.isArray(domains)) domains = [ domains ];
  domains = [ ...utils.getIps(), ...domains ];

  domains = domains.join('?');

  let data = `${domains}|${cfg.endpoint.port}|${otp}`;

  var qr_svg = qr.image(data, { type: 'svg' });
  res.setHeader('Content-type', 'image/svg');
  qr_svg.pipe(res);
}

function postTest(req, res) {
  res.send("test!");
}

function getCert(req, res) {
  // Param "otp" or otp not found => 404
  if(!('otp' in req.query) || !(req.query.otp in otpCodes)) {
    try {
      res.sendStatus(404);
    } finally {
      res.end();
    }
    return;
  }

  // Remove OTP
  clearTimeout(otpCodes[req.query.otp]);
  delete otpCodes[req.query.otp];

  let cert = ca.generateClientCertificate({
    cn: serviceConfig.cert.cn, 
    c: serviceConfig.cert.c, 
    st: serviceConfig.cert.st, 
    l: serviceConfig.cert.l, 
    o: serviceConfig.cert.o, 
    ou: serviceConfig.cert.ou
  });

  const cfg = utils.loadConfig();

  let domains = cfg.endpoint.domainName || [];
  if(!Array.isArray(domains)) domains = [ domains ];
  domains = [ ...utils.getIps(), ...domains ];
  
  res.json({
    'hosts': domains, 
    'port': serviceConfig.endpoint.port || 8001, 
    'cert': cert.certificate, 
    'privKey': cert.privateKey
  });
}

module.exports.getServices = () => {
  return {
    "blockremote": {
      getInfo: () => { return {
        methods: ["start", "stop", "status", "onSave", "settings"],
        name: "Blockbrain Remote Server",
        description: "Manages Blockremote app clients, configurations and events", 
        version: 1, 
        options: [ ], 
        html: {
          "get": {
            "qr.svg": getQr_svg, 
            "cert": getCert
          }, 
          "post": { test: postTest }
        }
      }},
      status: () => { return "TODO"; },
      start: (srv, tools) => {
        serviceConfig = srv.config;
        utils = tools.utils;

        let cfg = utils.loadConfig();

        return server.start({
          utils: utils, 
          port: serviceConfig.endpoint.port || 8001, 
          host: serviceConfig.endpoint.bind || '0.0.0.0', 
          serverKey: serviceConfig.endpoint.serverKey, 
          serverCert: serviceConfig.endpoint.serverCert, 
          autogen: serviceConfig.endpoint.generateCertificate, 
          domainName: cfg.endpoint.domainName
        });
      },
      stop: (srv) => {
        serviceConfig = srv.config;
        if(!runPromise || !runPromiseResolve) return false;
        runPromiseResolve();
        runPromise = null;
        runPromiseResolve = null;
      },
      run: async (srv) => {
        serviceConfig = srv.config;
        srv.status = 1;
        if(runPromise || runPromiseResolve) return false; // Must stop before
        runPromise = new Promise(resolve => {
          runPromiseResolve = resolve;
        });
    
        await runPromise;
    
        srv.status = 0;
      }, 
      onSave: async (file, info) => {
        debug(`Parse script ${file} for blockremote commands (TODO)`);

/*        if(file in cronJobs) {
          // Jobs already exist
          for(let n = 0; n < cronJobs[file].length; n++) {
            cronJobs[file][n].stop();
          }

          delete cronJobs[file]; // Deletes stopped jobs refs for this file
        }

        for(let n = 0; n < info.blocks.length; n++) {
          utils.executeCode(info.blocks[n], { "___Return Cron Expression": true }).then((cronExpr) => {
            cronExpr.forEach((prom) => {
              prom.then(expr => {
                if(expr) {
                  if(!(file in cronJobs)) {
                    cronJobs[file] = [];
                  }

                  try {
                    debug(`Installs cron expression ${expr} on a block in script ${file}`);

                    let cron = new CronJob(expr, function() {
                      try {
                        utils.executeCode(info.blocks[n], {});
                      } catch(e) {
                        log.e(`Error during scheduled execution: ${e.message}`);
                        debug(e.stack);
                      }
                    }, null, true, timeZone);

                    cronJobs[file].push(cron);
                  } catch {
                    log.e("Could not install cron expresion. Is it correct?")
                  }
                } else {
                  debug("Cannot use cron expression. Execution not programmed");
                }
              });
            });
          });
        }*/

      }, 

      settingsTemplate: (srv) => {
        debug('settingsTemplate');
      },     

      htmlCallback: async(req, res) => {
        console.log("Callback!!");
        res.send("blockremote!!");
      }
    }
  };
}


module.exports.getInfo = (env) => {
  return {
    "id": "blockremote",
    "name": "Blockbrain Remote Server",
    "author": "Alfonso Vila"
  }
}



module.exports.getBlocks = () => {
  return {
/*    "tasker_scheduled_event": { block: blocks.taskerScheduledEvent, run: blockCode.taskerScheduledEvent }, 
    "cron_everyday": { block: blocks.cronEveryday, run: blockCode.cronEveryday }, 
    "cron_dom": { block: blocks.cronDom, run: blockCode.cronDom }, 
    "cron_dow": { block: blocks.cronDow, run: blockCode.cronDow }, 
    "cron_every_time": { block: blocks.cronEveryTime, run: blockCode.cronEveryTime }, 
    "cron_hours": { block: blocks.cronHours, run: blockCode.cronHours }, 
    "program_job": { block: blocks.programJob, run: blockCode.programJob }*/
  }
}

module.exports.getToolbox = () => {
    return {
/*        "default": {
            "Scheduled tasks": ' \
            <block type="tasker.tasker_scheduled_event"></block> \
            <block type="tasker.cron_everyday"></block> \
            <block type="tasker.cron_dom"></block> \
            <block type="tasker.cron_dow"></block> \
            <block type="tasker.cron_every_time"></block> \
            <block type="tasker.cron_hours"></block> \
            <block type="tasker.program_job"></block> \
            '
        }*/
    }
}
