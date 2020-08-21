'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('blockbrain:plugins');
const log = global.log;
const slog = global.slog;

var blockLibs = {};
var defaultLib = {};
var defaultToolboxes = [];
var services = {};
var utils = {}; 

// External events
var onReloadEvents = [];

async function reload(globalUtils) {
  blockLibs = {};
  debug("Plugin load start...");
  await defaultPlugins('./internalPlugins', globalUtils);
  await reloadPlugins('./plugins');

  services = createServiceList();
  utils = globalUtils;

  onReloadEvents.forEach((cb) => { cb(); });
}

async function defaultPlugins(dirname, globalUtils) {
  utils = globalUtils;
  debug("Reads default plugins directory " + dirname);
  var files = fs.readdirSync(dirname);
  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    var file = files[fk[fn]];
    var fromPath = path.join(dirname, file);
    var toPath = path.join(dirname, file);

    var stat = fs.statSync(fromPath);

    if(stat.isFile()) {
      try {
        debug("Reads file " + fromPath);
        var lib = require('./' + fromPath);

        if("getBlocks" in lib) {
          if("getToolbox" in lib) {
            defaultToolboxes.push(await lib.getToolbox());
          }

          let libBlocks = await lib.getBlocks(services, globalUtils);
          var blocks = Object.keys(libBlocks);

          for(let n = 0; n < blocks.length; n++) {
            defaultLib[blocks[n]] = libBlocks[blocks[n]];
          }
        }
      } catch(e) {
        log.e("Error while loading default plugin from " + fromPath);
        debug(e.toString() + "(" + e.code + ")");
        debug("Stack " + fromPath + ": \n" + e.stack);
      }
    } else if(stat.isDirectory()) {
      await defaultPlugins(fromPath, globalUtils);
    }
  }
}

async function reloadPlugins(dirname) {
  debug("Reads plugins directory " + dirname);

  var files = fs.readdirSync(dirname);

  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    //files.forEach(async function (file, index) {
    var file = files[fk[fn]];
    var fromPath = path.join(dirname, file);
    var toPath = path.join(dirname, file);

    var stat = fs.statSync(fromPath);

    // *.js but not *.lib.*.js nor *.lib.js
    if(stat.isFile() && fromPath.match(/^((?!\.lib\.).)*\.js$/)) {
      try {
        debug("Reads file " + fromPath);
        var lib = require('./' + fromPath);

        var methods = Object.keys(lib);

        if(!('getInfo' in lib)) {
          log.w("File '" + fromPath + "' is not a plugin file. Incorrect methods");
          debug("File '" + fromPath + "' is not a plugin file. Incorrect methods");
        } else {
          var info = lib.getInfo();
          if(info.id != null) {
            blockLibs[info.id] = lib;
            debug("Loaded library '" + info.name + "':'" + info.id + "' from " + fromPath);
          }
        }
      } catch(e) {
        log.e("Error while loading plugin from " + fromPath);
        log.e(e.toString() + "(" + e.code + ")");
        log.e("Stack " + fromPath + ": \n" + e.stack);
      }

    } else if(stat.isDirectory()) {
      await reloadPlugins(fromPath);
    }
  }
}

async function getDefaultBlocks(conf) {
  debug("plugins getDefaultBlocks");
  var libIds = Object.keys(defaultLib);
  var ret = {};
  for(var n=0; n<libIds.length; n++) {
    debug("Default library " + libIds[n]);
    var lib = defaultLib[libIds[n]];
    if("block" in lib) {
      ret[libIds[n]] = lib.block;
    }
  }
  return ret;
}

async function getBlocks(conf, services, utils) {
  debug("plugins getBlocks");
  var libIds = Object.keys(blockLibs);
  var ret = {};
  for(var n=0; n<libIds.length; n++) {
    var lib = blockLibs[libIds[n]];
    var data = await lib.getBlocks(services, utils);
    var blockIds = Object.keys(data);
    for(var n2=0; n2 < blockIds.length; n2++) {
      var blockName = libIds[n] + "." + blockIds[n2];
      if(ret[blockName] != undefined) {
        log.e("Found block redefinition: " + blockName);
      }
      if(!('block' in data[blockIds[n2]])) {
          log.w("No block definition in library " + blockName);
      } else {
        var blockData;
        if(typeof data[blockIds[n2]].block !== "function")
          blockData = data[blockIds[n2]].block;
        else {
          try {
            blockData = data[blockIds[n2]].block(services.getServices());
          } catch(e) {
            log.e(`Error loading service '${blockName}' blocks: ${e.message}`);
            debug(e.stack);
          }
        }

        if(typeof(blockData) == "function") {
          blockData = await blockData();
        }
        blockData.type = blockName;
        blockData.helpUrl = conf.system.helpUrl + "?block=" + blockName;
        ret[blockName] = blockData;
        debug("Block added: " + blockName);
      }
    }
  }
  return ret;
}

async function getBlock(blockName, callback) {
  var matches;
  if(matches = blockName.match(/^([^\.]*)\.(.*)/)) {
    var libName = matches[1];
    var blockName = matches[2];
    if(libName in blockLibs) {
      let blocks = await blockLibs[libName].getBlocks();
      if(blockName in blocks) {
        callback(false, blocks[blockName]);
      } else {
        callback(true, "Block " + blockName + " does no exist in library " + libName);
      }
    } else {
      callback(true, "Library " + libName + " does not exist");
    }
  } else {
    // No dot in name: default operator
    if(blockName in defaultLib) {
      slog.w("Default block: " + blockName);
      debug("Default block" +  JSON.stringify(defaultLib[blockName]));
      callback(false, defaultLib[blockName]);
    } else {
      callback(true, "Block " + blockName + " does no exist in default library");
    }
  }
}

async function getBlockSync(blockName, services, utils) {
  debug("getBlockSync: " + blockName);
  var matches;
  if(matches = blockName.match(/^([^\.]*)\.(.*)/)) {
    var libName = matches[1];
    var blockName = matches[2];
    if(libName in blockLibs) {
      let blocks = await blockLibs[libName].getBlocks(services, utils);
      if(blockName in blocks) {
        return blocks[blockName];
      } else {
        throw new Error("Block " + blockName + " does no exist in library " + libName);
      }
    } else {
      throw new Error("Library " + libName + " does not exist");
    }
  } else {
    // No dot in name: default operator
    if(blockName in defaultLib) {
      var ret = defaultLib[blockName];
      return ret;
    } else {
      throw new Error("Block " + blockName + " does no exist in default library");
    }
  }
}

async function getBlockCustomPropertiesSync(services, utils) {
  let ret = {};
  let libIds = Object.keys(defaultLib);
  for(let n=0; n<libIds.length; n++) {
    let lib = defaultLib[libIds[n]];
    if("properties" in lib) {
      ret[libIds[n]] = lib.properties;
    }
  }


  libIds = Object.keys(blockLibs);
  for(let n=0; n<libIds.length; n++) {
    let lib = blockLibs[libIds[n]];
    let blocks = await lib.getBlocks(services, utils);
    let bIds = Object.keys(blocks);
    for(let m=0; m<bIds.length; m++) {
      let block = blocks[bIds[m]];

      if("properties" in block) {
        ret[libIds[n] + "." + bIds[m]] = block.properties;
      }
    }
  }

  return ret;
}

async function getToolboxes(conf) {
  var ret = {};
  for(var n=0; n<defaultToolboxes.length; n++) {
    var data = defaultToolboxes[n];

    var tbIds = Object.keys(data);

    for(var n2=0; n2 < tbIds.length; n2++) {
      var tb = data[tbIds[n2]];
      var tbCatIds = Object.keys(tb);
      for(var n3=0; n3<tbCatIds.length; n3++) {
        var tbCat = tb[tbCatIds[n3]];

        if(!(tbIds[n2] in ret)) ret[tbIds[n2]] = {};
        if(!(ret[tbIds[n2]][tbCatIds[n3]])) ret[tbIds[n2]][tbCatIds[n3]] = [];

        ret[tbIds[n2]][tbCatIds[n3]].push(tb[tbCatIds[n3]]);
      }
    }
  }

  var libIds = Object.keys(blockLibs);
  for(var n=0; n<libIds.length; n++) {
    var lib = blockLibs[libIds[n]];
    var data = await lib.getToolbox(services, utils);

    var tbIds = Object.keys(data);

    for(var n2=0; n2 < tbIds.length; n2++) {
      var tb = data[tbIds[n2]];
      var tbCatIds = Object.keys(tb);
      for(var n3=0; n3<tbCatIds.length; n3++) {
        var tbCat = tb[tbCatIds[n3]];

        if(!(tbIds[n2] in ret)) ret[tbIds[n2]] = {};
        if(!(ret[tbIds[n2]][tbCatIds[n3]])) ret[tbIds[n2]][tbCatIds[n3]] = [];

        ret[tbIds[n2]][tbCatIds[n3]].push(tb[tbCatIds[n3]]);
      }
    }
  }

  return ret;
}

function createServiceList(conf) {
  var libIds = Object.keys(blockLibs);
  let ret = {};
  for(var n=0; n<libIds.length; n++) {
    let srv = blockLibs[libIds[n]].getServices();
    let srvIds = Object.keys(srv);
    for(let s = 0; s < srvIds.length; s++) {
      ret[srvIds[s]] = srv[srvIds[s]];
    }
  }
  return ret;
}

function getServices(conf) {
  return services;
}

function onReload(cb) {
  debug("Reload events");
  onReloadEvents.push(cb);
}

module.exports = {
  reload: reload,
  blockLibs: blockLibs,
  getDefaultBlocks: getDefaultBlocks,
  getBlocks: getBlocks,
  getBlock: getBlock,
  getBlockSync: getBlockSync,
  getBlockCustomPropertiesSync: getBlockCustomPropertiesSync,
  getToolboxes: getToolboxes,
  getServices: getServices,
  onReload: onReload
}
