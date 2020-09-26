'use strict';

module.exports = {
  readOid: {
    "type": "readOid",
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
  }, 
  walkOid: {
    "type": "walkOid",
    "message0": "walk %1 OIDs %2",
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
          ]
        ]
      },
      {
        "type": "input_value",
        "name": "OID"
      }
    ],
    "output": [
      "String",
      "json"
    ],
    "colour": 180,
    "tooltip": "Reads the given OID subtree",
    "helpUrl": ""
  }, 

  systemInfo: {
    "type": "systemInfo",
    "message0": "get system %1 %2",
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
          ]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "TOPIC",
        "options": [
          [
            "general information",
            "INFO"
          ],
          [
            "cpu usage",
            "CPU"
          ],
          [
            "disk information",
            "DISK"
          ],
          [
            "network information",
            "NETWORK"
          ],
          [
            "network performance",
            "NETPERF"
          ]
        ]
      }
    ],
    "output": [
      "String",
      "json"
    ],
    "colour": 180,
    "tooltip": "Reads the given host information through SNMP",
    "helpUrl": ""
  }
}