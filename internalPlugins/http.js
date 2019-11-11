'use strict';

var httpEndpointBlock = {
  "block": {
    "type": "http_endpoint",
    "message0": "http endpoint %1 %2",
    "args0": [
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
      context.blockIn();
      return await context.continue("CODE");
  }
}

function getBlocks() {
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
