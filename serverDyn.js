'use strict';

var fs = require('fs');
const log = global.log;
const xml_js = require('xml-js');

var conf;
var plugins = null;

const cacheDir = "/.cache";
const cacheTree = "blockTree.json";

function config(data) {
  conf = data.config;
  plugins = data.plugins;
}

function prepare(res) {
  res.type('application/javascript');
}

function prepareJson(res) {
  res.type('application/json');
}

function blockLoader(req, res) {
  prepare(res);

  var blockFiles = [
    "event_received",
    "event_return",
    "event_return_stop",
    "foreach_json",
//    "obj_builder",
//    "obj_builder_decom",
    "obj_get",
    "obj_set",
    "obj_stringify",
    "rgx_match"
  ];

  var ret = "function createCustomBlockly() {\n";

  ret += "Blockly.defineBlocksWithJsonArray([\n";

  ret += fs.readFileSync('./public/assets/js/blocks/' + blockFiles[0] + '.json');

  for(var n = 1; n < blockFiles.length; n++) {
    ret += ", ";
    ret += fs.readFileSync('./public/assets/js/blocks/' + blockFiles[n] + '.json');
  }

  ret += "]);\n\n";

  blockFiles.forEach(function(f) {
    ret += fs.readFileSync('./public/assets/js/blocks/gen/' + f + '.js') + "\n";
  });

  ret += "}\n";

  res.send(ret);
}

async function getFolderContents(path) {
    let result = Array();
    let files = fs.readdirSync(path);
    for (let i = 0; i < files.length; i++) {
        var filePath = path + '/' + files[i];
        if (fs.statSync(filePath).isDirectory()) {
          if(!files[i].startsWith('.')) {
            result.push({
              text: files[i],
              path: filePath,
              type: "dir",
              children: await getFolderContents(filePath).then().catch((e) => {})
            });
          }
        } else {
          if(files[i].endsWith('.xml')) {
            result.push({
              text: files[i],
              path: filePath,
              type: "file",
              icon: "glyphicon glyphicon-leaf"
            });
          }
        }
    }

    console.dir(result);

    return result;
}

async function buildBlockTree() {
  const cacheFile = conf.blocks.path + cacheDir + "/" + cacheTree;
  if(!fs.existsSync(conf.blocks.path + cacheDir)) {
    fs.mkdirSync(conf.blocks.path + cacheDir);
  }
  var data = await getFolderContents(conf.blocks.path).then().catch((e)=>{});

  fs.writeFileSync(conf.blocks.path + cacheDir + "/" + cacheTree,
    JSON.stringify(data), 'utf-8');
}

async function blockTree(req, res) {
  prepareJson(res);

  if(!fs.existsSync(conf.blocks.path + cacheDir + "/" + cacheTree)) {
    await buildBlockTree().then().catch((e)=>{});
  }

  if(fs.existsSync(conf.blocks.path + cacheDir + "/" + cacheTree)) {
    var data = fs.readFileSync(conf.blocks.path + cacheDir + "/" + cacheTree);
    res.json(JSON.parse(data));
  }
}

async function blocks(req, res) {
  prepareJson(res);
  res.json(await plugins.getBlocks(conf));
}

async function blocksJs(req, res) {
  prepare(res);
  var blocks = await plugins.getBlocks(conf);
  var ids = Object.keys(blocks);

  var ret = "function createCustomBlockly() {\n"
  ret += "Blockly.defineBlocksWithJsonArray([\n";
  for(var n = 0; n < ids.length; n++) {
    if(n>0) ret += ",\n";
    ret += JSON.stringify(blocks[ids[n]]);
  }
  ret += "])};";
  res.send(ret);
}

async function toolboxesJs(req, res) {
  prepare(res);

  var ret = "";

  var tbs = await plugns.getToolbox();

  var tbsIds = Object.keys(tbs);
  for(n=0; n < tbsIds.length; n++) {
    var xml = self.getToolboxXml("default", tbs[tbsIds[n]]);
    ret += "\n\n\n" + xml;
  }

  res.send(ret);
}

async function toolboxesJson(req, res) {
  prepareJson(res);

  var tbxs = await plugins.getToolboxes(conf);
  res.send(JSON.stringify(tbxs));
}

async function getToolboxXml(name, data) {}

module.exports = {
  config: config,
  blockLoader: blockLoader,
  blockTree: blockTree,
  blocks: blocks,
  blocksJs: blocksJs,
  toolboxesJs: toolboxesJs,
  toolboxesJson: toolboxesJson
};
