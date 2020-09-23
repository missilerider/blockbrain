'use strict';

var httpEndpointBlock = {
  "block": {
    "type": "http_endpoint",
    "message0": "http endpoint %1 %2 %3",
    "args0": [
      {
        "type": "field_input",
        "name": "PATH",
        "text": "path/to/event"
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "input_statement",
        "name": "CODE"
      }
    ],
    "colour": 210,
    "tooltip": "",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      var rgx = context.getField('RGX');
      matches = context.getVar('PATH').text.match(rgx);
  
      context.blockIn();
      return await context.continue("CODE");
  }
}

async function getBlocks() {
  return {
    "http_endpoint": httpEndpointBlock
  };
}

function getToolbox() {
  return {
    "default": {
      "Events": ' \
        <block type="http_endpoint"></block>'
    }
  }
}

module.exports = {
  getBlocks: getBlocks,
  getToolbox: getToolbox
}
