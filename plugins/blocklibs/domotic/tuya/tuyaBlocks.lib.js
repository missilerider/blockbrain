module.exports.defaultConfig = {
  "email": "Tuya.user.email@mail_domain.com", 
  "password": "TuyaAppPassword", 
  "countryCode": "34",
  "bizType": "smart_life",
  "region": "eu", 
  "autoDiscovery": {
    "enabled": true, 
    "interval": 300
  }
}

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

module.exports.discovery = {
  "type": "tuya_discovery",
  "message0": "discover Tuya local devices",
  "output": "Array",
  "colour": 330,
  "tooltip": "Performs a tuya device discovery on local network",
  "helpUrl": ""
};
