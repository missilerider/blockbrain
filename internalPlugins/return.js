'use strict';

var abortBlock = {
  "block": {
    "type": "abort",
    "message0": "abort execution",
    "previousStatement": null,
    "colour": 210,
    "tooltip": "Aborts execution without returning any value",
    "helpUrl": ""
  },
  "run":
    async (context) => {
      context.blockIn();
      context.setVar("msg", null);
      context.getRunFlow().flowState = -1;
      return null;
  }
}

async function getBlocks() {
  return {
    "abort": abortBlock
  };
}

function getToolbox() {
  return {
    "default": {
      "Events": ' \
        <block type="abort"></block>'
    }
  }
}

module.exports = {
  getBlocks: getBlocks,
  getToolbox: getToolbox
}
