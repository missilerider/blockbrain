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
  "messaging": {
    "deduplicate": true
  }
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

publishMessage = {
  "type": "mqtt_send_message",
  "message0": "publish mqtt message %1 topic %2 %3 message %4",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "field_input",
      "name": "TOPIC",
      "text": "test/echo"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_value",
      "name": "MSG"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 150,
  "tooltip": "Send a new MQTT message",
  "helpUrl": ""
};

publishMessageEx = {
  "type": "mqtt_send_message_ex",
  "lastDummyAlign0": "RIGHT",
  "message0": "publish mqtt message %1 topic %2 message %3 QoS %4 Once %5 retain %6 %7 expiry %8 seconds",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_value",
      "name": "TOPIC",
      "align": "RIGHT"
    },
    {
      "type": "input_value",
      "name": "MSG",
      "align": "RIGHT"
    },
    {
      "type": "field_dropdown",
      "name": "QOS",
      "options": [
        [
          "0: Only",
          "0"
        ],
        [
          "1: At Least",
          "1"
        ],
        [
          "2: Exactly",
          "2"
        ]
      ]
    },
    {
      "type": "input_dummy",
      "align": "RIGHT"
    },
    {
      "type": "field_checkbox",
      "name": "RETAIN",
      "checked": false
    },
    {
      "type": "input_dummy",
      "align": "RIGHT"
    },
    {
      "type": "field_input",
      "name": "EXPIRY",
      "text": "0"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 150,
  "tooltip": "Send a new MQTT message",
  "helpUrl": ""
};

module.exports = {
  baseConfig: baseConfig,
  message: message,
  publishMessage: publishMessage,
  publishMessageEx: publishMessageEx
}
