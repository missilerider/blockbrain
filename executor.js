'use strict';

const xml_js = require('xml-js');
const contextFactory = require('./context.js');
const log = global.log;

var plugins = null;

var ctxt = [];

function config(options) {
  plugins = options.plugins;
}

async function executeProgram(xmlProgram, options) {
  let json = JSON.parse(xml_js.xml2json(xmlProgram, { compact: true, spaces: 4 }));
  return executeProgramJson(json, options);
}

async function executeProgramJson(json, options) {
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
      let codeBlock = plugins.getBlockSync(block._attributes.type);//, async (err, codeBlock) => {
      context = null;
      context = contextFactory.createContext({
        plugins: plugins,
        program: block,
        block: codeBlock,
        msg: options.msg
      });

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
