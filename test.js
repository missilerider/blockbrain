'use strict';

const fs = require('fs');
const xml2json = require('xml2json');
if(global.log == undefined)
  global.log = require('./log.js');

const log = global.log;
log.setLogLevel("DEBUG");
const plugins = require('./plugins.js');
const executor = require('./executor.js');

async function main() {
  await plugins.reload();

  executor.config({
    plugins: plugins
  })

  var data = fs.readFileSync('./vault/1234.xml');

  var execs = await executor.executeProgram(data, {
    nodeTypeFilter: null,
    msg: {
      topic: "test",
      payload: "contenido de prueba"
    }
  });

  console.dir(execs);
  console.log("Espera ejecuciones");
  console.dir(await Promise.all(execs));
  console.log("FIN de fin");
}

main();
