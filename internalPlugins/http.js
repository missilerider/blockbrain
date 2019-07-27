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
      return await context.continue(context, "CODE");
  }
}

module.exports = {
  "http_endpoint": httpEndpointBlock
}
