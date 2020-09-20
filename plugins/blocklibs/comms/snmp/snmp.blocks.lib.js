'use strict';

module.exports = {
  readOids: {
    "type": "snmp_readoid",
    "message0": "read %1 OIDs %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "HOST",
        "options": [
          [
            "host1",
            "HOST1"
          ],
          [
            "host2",
            "HOST2"
          ],
          [
            "host3",
            "HOST3"
          ]
        ]
      },
      {
        "type": "input_value",
        "name": "OID",
        "check": [
          "Array",
          "String"
        ]
      }
    ],
    "output": "Array",
    "colour": 180,
    "tooltip": "Reads the given OID list",
    "helpUrl": ""
  }
}