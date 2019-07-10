'use strict';

const fs = require('fs');
const path = require('path');
const log = global.log;


var blockLibs = {};
var defaultLib = {};

async function reload() {
  blockLibs = {};
  log.d("Inicia carga de plugins");
  await defaultPlugins('./internalPlugins');
  await reloadPlugins('./plugins');
  log.d("reloadPlugins: " + JSON.stringify(Object.keys(blockLibs)));
  log.d(blockLibs);
}

async function defaultPlugins(dirname) {
  var files = fs.readdirSync(dirname);
  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    var file = files[fk[fn]];
    var fromPath = path.join(dirname, file);
    var toPath = path.join(dirname, file);

    var stat = fs.statSync(fromPath);

    if(stat.isFile()) {
      try {
        log.i("Reads file " + fromPath);
        var lib = require('./' + fromPath);

        var blocks = Object.keys(lib);

        for(let n = 0; n < blocks.length; n++) {
          defaultLib[blocks[n]] = lib[blocks[n]];
        }
      } catch(e) {
        log.e("Error while loading default plugin from " + fromPath);
        log.d(e.toString() + "(" + e.code + ")");
        log.d("Stack " + fromPath + ": \n" + e.stack);
      }
    } else if(stat.isDirectory()) {
      await defaultPlugins(fromPath);
    }
  }
}

async function reloadPlugins(dirname) {
  log.i("Reads directory " + dirname);

  var files = fs.readdirSync(dirname);

  var fk = Object.keys(files);
  for(var fn = 0; fn < fk.length; fn++) {
    //files.forEach(async function (file, index) {
    var file = files[fk[fn]];
    var fromPath = path.join(dirname, file);
    var toPath = path.join(dirname, file);

    var stat = fs.statSync(fromPath);

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
  }
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

async function getBlock(blockName, callback) {
  var matches;
  if(matches = blockName.match(/^([^\.]*)\.(.*)/)) {
    var libName = matches[1];
    var blockName = matches[2];
    if(libName in blockLibs) {
      let blocks = blockLibs[libName].getBlocks();
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
      console.log("Default block: " + blockName);
      console.dir(defaultLib[blockName]);
      callback(false, defaultLib[blockName]);
    } else {
      callback(true, "Block " + blockName + " does no exist in default library");
    }
  }
}

function getBlockSync(blockName) {
  console.log("11" +  blockName);
  var matches;
  if(matches = blockName.match(/^([^\.]*)\.(.*)/)) {
    var libName = matches[1];
    var blockName = matches[2];
    if(libName in blockLibs) {
      let blocks = blockLibs[libName].getBlocks();
      if(blockName in blocks) {
        return blocks[blockName];
      } else {
        throw new Error("Block " + blockName + " does no exist in library " + libName);
      }
    } else {
      throw new Error("Library " + libName + " does not exist");
    }
  } else {
    console.log("22" + blockName);
    // No dot in name: default operator
    if(blockName in defaultLib) {
      log.dump("default", blockName);
      var ret = defaultLib[blockName];
      return ret;
    } else {
      throw new Error("Block " + blockName + " does no exist in default library");
    }
  }
}

async function getToolboxes(conf) {
  var libIds = Object.keys(blockLibs);
  var ret = {};
  for(var n=0; n<libIds.length; n++) {
    var lib = blockLibs[libIds[n]];
    var data = lib.getToolbox();

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

module.exports = {
  reload: reload,
  blockLibs: blockLibs,
  getBlocks: getBlocks,
  getBlock: getBlock,
  getBlockSync: getBlockSync,
  getToolboxes: getToolboxes
}
