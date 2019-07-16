'use strict';

const xml2json = require('xml2json');
const log = global.log;

var plugins = null;

function config(options) {
  plugins = options.plugins;
}

async function executeProgram(xmlProgram, options) {
  let json = JSON.parse(xml2json.toJson(xmlProgram, { reversible: false, trim: false }));

  var blocks;
  if(Array.isArray(json.xml.block)) {
    blocks = json.xml.block;
  } else {
    blocks = [ json.xml.block ];
  }

  let ret = []; // Return promises

  plugins.test = "plugins test!!";

  for(let b = 0; b < blocks.length; b++) {
    let block = blocks[b];

    // Filtered type?
    if(!options.nodeTypeFilter || options.nodeTypeFilter.indexOf(block.type) > -1) {
      // Get block from plugin library
      log.d("Get block " + block.type);
      let codeBlock = plugins.getBlockSync(block.type);//, async (err, codeBlock) => {
      var context = require('./context.js');
      context.prepare({
        plugins: plugins,
        program: block,
        block: codeBlock,
        msg: options.msg
      });

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
  config: config
}
