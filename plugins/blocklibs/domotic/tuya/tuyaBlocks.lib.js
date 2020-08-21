module.exports.tuyaSendCommand = {
  "type": "tuya_cmd",
  "message0": "new telegram text message %1 regex %2 %3 %4",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "field_input",
      "name": "RGX",
      "text": ".*"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "CMD"
    }
  ],
  "colour": 195,
  "tooltip": "Sends a command to a Tuya device",
  "helpUrl": ""
};
