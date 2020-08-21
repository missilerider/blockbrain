'use strict';

var fs = require('fs');
const log = global.log;
const jsStringEscape = require('js-string-escape');

var conf;
var plugins = null;
var services = null;
var utils = null;

const cacheDir = "/.cache";
const cacheTree = "blockTree.json";

function dispatcher(req, res, next) {
	switch(req._parsedUrl.pathname) {
		case '/assets/dyn/blockLoader.js': return blockLoader(req, res, next);
		case '/assets/dyn/blockTree.json': return blockTree(req, res, next);
		case '/assets/dyn/blocks.js': return blocksJs(req, res, next);
		case '/assets/dyn/blocks.json': return blocks(req, res, next);
		case '/assets/dyn/blockProps.js': return blockPropsJs(req, res, next);
		case '/assets/dyn/toolboxes.js': return toolboxesJs(req, res, next);
		case '/assets/dyn/toolboxes.json': return toolboxesJson(req, res, next);
		default:
			res.status(404);
			break;
	}
}

function config(data) {
  conf = data.config;
  plugins = data.plugins;
  services = data.services;
  utils = data.utils;
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
              icon: "folder", 
              children: await getFolderContents(filePath).then().catch((e) => {})
            });
          }
        } else {
          if(files[i].endsWith('.xml')) {
            result.push({
              text: files[i],
              path: filePath,
              editorPath: Buffer.from(filePath.substring(conf.blocks.path.length + 1).slice(0, -4)).toString("base64"),
              type: "file",
              icon: "extension"
            });
          }
        }
    }

    return result;
}

async function buildBlockTree() {
  /*const cacheFile = conf.blocks.path + cacheDir + "/" + cacheTree;
  if(!fs.existsSync(conf.blocks.path + cacheDir)) {
    fs.mkdirSync(conf.blocks.path + cacheDir);
  }*/
  var data = await getFolderContents(conf.blocks.path).then().catch((e)=>{});

  //fs.writeFileSync(conf.blocks.path + cacheDir + "/" + cacheTree,
    //JSON.stringify(data), 'utf-8');

  return data;
}

async function blockTree(req, res) {
  prepareJson(res);

  let data;

  data = await buildBlockTree().then().catch((e)=>{
    throw e;
  });
  res.json(data);
}

async function blocks(req, res) {
  prepareJson(res);
  res.json(await plugins.getBlocks(conf));
}

async function blocksJs(req, res) {
  prepare(res);
  var ret = "function createCustomBlockly() {\n"
  ret += "Blockly.defineBlocksWithJsonArray([\n";

	let blocks = await plugins.getDefaultBlocks(conf);
  let ids = Object.keys(blocks);

	for(let n = 0; n < ids.length; n++) {
//    log.d(ids[n]);
    if(n>0) ret += ",\n";
    ret += JSON.stringify(blocks[ids[n]]);
  }

	blocks = await plugins.getBlocks(conf, services, utils);
  ids = Object.keys(blocks);

  for(let n = 0; n < ids.length; n++) {
//    log.d(ids[n]);
    ret += ",\n";
    ret += JSON.stringify(blocks[ids[n]]);
  }
  ret += "])};";
  res.send(ret);
}

function genToolbox(part, isDefault = false) {
  var ret = "";
  switch(part) {
    case "header":
      ret = '<xml xmlns="http://www.w3.org/1999/xhtml" id="toolbox" style="display: none;">';
      if(isDefault) {
        ret += fs.readFileSync('./assets/toolbox.default.body.xml', 'utf8');
      }
      break;

    case "footer":
      ret = fs.readFileSync('./assets/toolbox.default.footer.xml', 'utf8');
      break;
  }

  return ret;
}

async function toolboxesJs(req, res) {
  prepare(res);

  var ret = "";

  var tbs = await plugins.getToolboxes(conf);

	var tbsIds = Object.keys(tbs);

	ret += "var toolboxes = [\n";
	for(let n = 0; n < tbsIds.length; n++) {
		if(n!=0) ret += ", \n";
		ret += "\t'" + tbsIds[n] + "'";
	}
	ret += "\n];\n\n";

  ret += "function getToolbox(name) { \
    switch(name) {\n";

  for(let n=0; n < tbsIds.length; n++) {
    let tbTxt = "";
    let tbId = tbsIds[n];

    ret += "case '" + tbId + "': \nreturn \"";

    tbTxt = genToolbox("header", tbId == "default");

    var tbsCIds = Object.keys(tbs[tbId]);
    for(let n=0; n < tbsCIds.length; n++) {
      tbTxt += '<category name="' + tbsCIds[n] + '" colour="#000000">';
      tbTxt += tbs[tbId][tbsCIds[n]];
      tbTxt += '</category>';
    }
    tbTxt += genToolbox("footer", tbId == "default");

    ret += jsStringEscape(tbTxt);

    ret += "\";\n";
  }

  ret += "}\n}";

  res.send(ret);
}

async function toolboxesJson(req, res) {
  prepareJson(res);

  var tbxs = await plugins.getToolboxes(conf);
  res.send(JSON.stringify(tbxs));
}

async function blockPropsJs(req, res, next) {
  res.type('application/javascript');

  let ret = "";

	ret += "customMutationToDom = function() {\n";
	ret += "\tvar container = document.createElement('mutation');\n";
	ret += "\tcontainer.setAttribute('customproperties', JSON.stringify(this.customProperties));\n";
	ret += "\treturn container;\n";
	ret += "};\n\n";

	ret += "customDomToMutation = function(xmlElement) {\n";
	ret += "\ttry {\n";
	ret += "\t\tthis.customProperties = JSON.parse(xmlElement.getAttribute('customproperties'));\n";
	ret += "\t} catch(e) {};\n";
	ret += "};\n\n";

  ret += "function createCustomBlocklyProps() {\n";

	let props = await plugins.getBlockCustomPropertiesSync(services, utils);

  let ids = Object.keys(props);

	for(let n = 0; n < ids.length; n++) {
		ret += "\tBlockly.Blocks['" + ids[n] + "']['mutationToDom'] = customMutationToDom;\n";
		ret += "\tBlockly.Blocks['" + ids[n] + "']['domToMutation'] = customDomToMutation;\n";
  }

  ret += "};\n\n";

	ret += "customPropertiesTemplates = {\n";

	for(let n = 0; n < ids.length; n++) {
		ret += "\t\"" + ids[n] + "\": " + JSON.stringify(props[ids[n]]) + ", \n";
  }

	ret += "};";

  res.send(ret);
}

module.exports = {
  config: config,
  dispatcher: dispatcher
};
