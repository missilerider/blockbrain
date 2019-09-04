baseConfig = {
  "broker": {
    "host": "172.16.0.4",
    "port": 0,
    "protocol": "mqtt",
    "version": 4,
    "username": null,
    "password": null,
    "keepalive": 0,
    "reconnectPeriod": 1000,
    "validateCertificate": true
  },
  "topics": [
    "test/echo",
    "test/+/echo",
    "#"
  ]
};

message = {
  "type": "mqtt_message",
  "message0": "new mqtt message %1 regex %2 %3 %4",
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
  "colour": 150,
  "tooltip": "A new message is received from a MQTT subscription",
  "helpUrl": ""
};

module.exports = {
  baseConfig: baseConfig,
  message: message
}
