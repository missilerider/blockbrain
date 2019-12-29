'use strict';

const xml_js = require('xml-js');
const contextFactory = require('./context.js');
const log = global.log;

var plugins = null;
var services = null;
var utils = null;

var ctxt = [];

function config(options) {
  plugins = options.plugins;
  services = options.services;
  utils = options.utils;
}

async function executeProgram(xmlProgram, options) {
  let json = JSON.parse(xml_js.xml2json(xmlProgram, { compact: true, spaces: 4, trim: false, captureSpacesBetweenElements: true }));
  return executeProgramJson(json, options);
}

async function executeProgramJson(json, options, params = undefined) {
  let blocks;
  if(Array.isArray(json.xml.block)) {
    blocks = json.xml.block;
  } else {
    blocks = [ json.xml.block ];
  }

  let ret = []; // Return promises

  let context;
  for(let b = 0; b < blocks.length; b++) {
    let block = blocks[b];

    // Filtered type?
    if(!options.nodeTypeFilter || options.nodeTypeFilter.indexOf(block._attributes.type) > -1) {
      // Get block from plugin library
      log.d("Get block " + block._attributes.type);
      let codeBlock = await plugins.getBlockSync(block._attributes.type);
      context = null;
      context = contextFactory.createContext({
        plugins: plugins,
        program: block,
        block: codeBlock,
        msg: options.msg, 
        services: services, 
        utils: utils
      });

      context.params = params;

      ctxt.push(context.vars);

      context.step();

      // Run and keep promise
      let runprom = codeBlock.run(context);
      ret.push(runprom);
    }
  }

  return ret;
}

module.exports = {
  executeProgram: executeProgram,
  executeProgramJson: executeProgramJson,
  config: config
}
