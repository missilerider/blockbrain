'use strict';

var blockFiles = [
  "event_received",
  "event_return",
  "event_return_stop",
  "foreach_json",
  "obj_get",
  "obj_set",
  "obj_stringify",
  "rgx_match"
];

for(var f in blockFiles) {
  // Block definition
  $.ajax({
    url: "/assets/js/blocks/" + blockFiles[f] + ".json",
    type: 'GET',
    success: function(data) { Blockly.defineBlocksWithJsonArray([data]); }
  });

  // Block code generator
  $.ajax({
    url: "/assets/js/blocks/gen/" + blockFiles[f] + ".js",
    type: 'GET',
    success: function(data) { if(data.length == 0) return; Blockly.defineBlocksWithJsonArray([data]); }
  });
}

function saveCode() {
  var code = Blockly.JavaScript.workspaceToCode(workspace);
  console.log(code);
}
