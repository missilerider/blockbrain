const CronJob = require('cron').CronJob;

const blockCode = require('./tasker.code.lib.js');
const blocks = require('./tasker.blocks.lib.js');
const debug = require('debug')('blockbrain:script:tasker');

const log = global.log;

var utils = null; // Set at "start" from service "commonTools"

var runPromise = null;
var runPromiseResolve = null;

var serviceConfig = null;
var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Default local system timezone

var cronJobs = {}; // CronJobs, identified by script name

module.exports.getServices = () => {
  return {
    "tasker": {
      getInfo: () => { return {
        methods: ["start", "stop", "status", "onSave"],
        name: "Tasker",
        description: "Executes scheduled tasks defined inside scripts"
      }},
      status: () => { return "TODO"; },
      start: (srv, tools) => {
        serviceConfig = srv.config;
        utils = tools.utils;
    
        // Preloads keys and values if necesary
        if(serviceConfig.persistence) {
          loadKeys(serviceConfig);
        }
    
        return true;
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
        debug(`Parse script ${file} cron expressions`);

        if(file in cronJobs) {
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
        }

      }
    }
  };
}


module.exports.getInfo = (env) => {
  return {
    "id": "tasker",
    "name": "Scheduled execution tasks",
    "author": "Alfonso Vila"
  }
}



module.exports.getBlocks = () => {
  return {
    "tasker_scheduled_event": { block: blocks.taskerScheduledEvent, run: blockCode.taskerScheduledEvent }, 
    "cron_everyday": { block: blocks.cronEveryday, run: blockCode.cronEveryday }, 
    "cron_dom": { block: blocks.cronDom, run: blockCode.cronDom }, 
    "cron_dow": { block: blocks.cronDow, run: blockCode.cronDow }, 
    "cron_every_time": { block: blocks.cronEveryTime, run: blockCode.cronEveryTime }, 
    "cron_hours": { block: blocks.cronHours, run: blockCode.cronHours }
  }
}

module.exports.getToolbox = () => {
    return {
        "default": {
            "Scheduled tasks": ' \
            <block type="tasker.tasker_scheduled_event"></block> \
            <block type="tasker.cron_everyday"></block> \
            <block type="tasker.cron_dom"></block> \
            <block type="tasker.cron_dow"></block> \
            <block type="tasker.cron_every_time"></block> \
            <block type="tasker.cron_hours"></block> \
            '
        }
    }
}
