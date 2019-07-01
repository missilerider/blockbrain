'use strict';

const fs = require('fs');
const path = require('path');
const log = global.log;


var blockLibs = {};

async function reload() {
  blockLibs = {};
  log.d("Inicia carga de plugins");
  await reloadPlugins('./plugins');
  log.d("reloadPlugins: " + JSON.stringify(Object.keys(blockLibs)));
  log.d(blockLibs);
}

async function reloadPlugins(dirname) {
  log.i("Reads directory " + dirname);

  var files = fs.readdirSync(dirname);//, function (err, files) {
/*    if (err) {
      log.e("Could not list directory " + dirname);
      return;
    }*/

    var fk = Object.keys(files);
    for(var fn = 0; fn < fk.length; fn++) {
      //files.forEach(async function (file, index) {
      var file = files[fk[fn]];
      var fromPath = path.join(dirname, file);
      var toPath = path.join(dirname, file);

      var stat = fs.statSync(fromPath);//, async function (err, stat) {
/*        if (err) {
          log.e("Could not read file " + fromPath);
          return;
        }*/

        if(stat.isFile()) {
          try {
            log.i("Reads file " + fromPath);
            var lib = require('./' + fromPath);

            var methods = Object.keys(lib);

            log.dump("lib", lib);
            log.dump("methods", methods);

            if(!('getInfo' in lib)) {
              log.e("Module " + fromPath + ". Incorrect methods");
            } else {
              var info = lib.getInfo();
              log.dump("getInfo", info);
              if(info.id != null) {
                blockLibs[info.id] = lib;
                log.d("Loaded library '" + info.name + "':'" + info.id + "' from " + fromPath);
                log.d(lib);
              }
            }
          } catch(e) {
            log.e("Error while loading plugin from " + fromPath);
            log.d(e.toString() + "(" + e.code + ")");
            log.d("Stack " + fromPath + ": \n" + e.stack);
          }

        } else if(stat.isDirectory()) {
          await reloadPlugins(fromPath);
        }
//      });
    }
//    });
//  });
}

async function getBlocks(conf) {
  var libIds = Object.keys(blockLibs);
  var ret = {};
  for(var n=0; n<libIds.length; n++) {
    var lib = blockLibs[libIds[n]];
    var data = lib.getBlocks();
    var blockIds = Object.keys(data);
    for(var n2=0; n2 < blockIds.length; n2++) {
      var blockName = libIds[n] + "." + blockIds[n2];
      if(ret[blockName] != undefined) {
        log.e("Found block redefinition: " + blockName);
      }
      if(!('block' in data[blockIds[n2]])) {
          log.w("No block definition in library " + blockName);
      } else {
        var blockData = data[blockIds[n2]].block;
        if(typeof(blockData) == "function") {
          blockData = await blockData();
        }
        blockData.type = blockName;
        blockData.helpUrl = conf.system.helpUrl + "?block=" + blockName;
        ret[blockName] = blockData;
        log.d("Block added: " + blockName);
      }
    }
  }
  log.dump("Devuelve", ret);
  return ret;
}

async function getToolboxes(conf) {
  var libIds = Object.keys(blockLibs);
  var ret = {};
  for(var n=0; n<libIds.length; n++) {
    var lib = blockLibs[libIds[n]];
    var data = lib.getBlocks();
    var blockIds = Object.keys(data);
    for(var n2=0; n2 < blockIds.length; n2++) {
      var blockName = libIds[n] + "." + blockIds[n2];

      var block = data[blockIds[n2]];

      if('toolbox' in block) {
        var toolboxData;
        if(block.toolbox != undefined && block.toolbox.toolbox != undefined) {
          if(!(block.toolbox.toolbox in ret)) ret[toolboxData.toolbox] = {};

          if(!(toolboxData.toolbox in ret)) ret[toolboxData.toolbox] = [];
          ret[toolboxData.toolbox].push(blockName);
        }
      }

      log.dump(blockName, data[blockIds[n2]]);
    }
  }
  return ret;
}

module.exports = {
  reload: reload,
  blockLibs: blockLibs,
  getBlocks: getBlocks,
  getToolboxes: getToolboxes
}
