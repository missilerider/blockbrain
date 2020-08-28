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

module.exports.serviceSettingsForm = [
  {
    "name": "email",
    "desc": "Tuya app email address",
    "type": "text",
    "width": 6
  }, 
  {
    "name": "password",
    "desc": "Tuya app password",
    "type": "text",
    "width": 3
  }, 
  {
    "name": "countryCode",
    "desc": "Local country code",
    "type": "number",
    "width": 2
  }, 
  {
    "name": "bizType",
    "desc": "Tuya business type",
    "type": "text",
    "width": 3
  }, 
  {
    "name": "region",
    "desc": "Tuya server region",
    "type": "text",
    "width": 2
  }, 
  {
    "name": "testHr", 
    "type": "hr"
  }, 
  {
    "name": "autoDiscovery",
    "desc": "Auto discovery enabled",
    "type": "checkbox",
    "width": 3
  }, 
  {
    "name": "autoDiscoveryInterval",
    "desc": "Time between auto discoveries, in seconds",
    "type": "number",
    "width": 4
  },
  {
    "name": "testHr", 
    "type": "hr"
  } 
];

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
