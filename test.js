'use strict';

const fs = require('fs');
const xml2json = require('xml2json');
global.log = require('./log.js');
const plugins = require('./plugins.js');

plugins.reload();

var context = {
  "continue": path => {
    console.log("Ejecuta " + path);
  },
  "exit": (code = 0, message = "") => {
    console.log("termina: " + code + ", " + message);
  }
}

fs.readFile('./vault/1234.xml', function(err, data) {
  var json = JSON.parse(xml2json.toJson(data, { reversible: false }));

  json.xml.block.forEach(block => {
    //console.dir(block);
    plugins.getBlock(block.type, (err, block) => {
      if(err) {
        console.log("Error: " + block);
      } else {
        block.run(context, { "test": "1234" });
      }
    });
  });
});
