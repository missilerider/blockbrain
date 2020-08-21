module.exports = {
blockSetSensorState: {
    "type": "ha_set_sensor",
    "message0": "set sensor %1 to %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "SENSOR",
        "options": [
          [
            "thing1Name",
            "thing1"
          ],
          [
            "thing2Name",
            "thing2"
          ]
        ]
      },
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 180,
    "tooltip": "Changes HA thing sensor value",
    "helpUrl": ""
  }, 
  blockSetSwitchState: {
    "type": "ha_set_switch",
    "message0": "change switch %1 to %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "thing1Name",
            "thing1"
          ],
          [
            "thing2Name",
            "thing2"
          ]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "NEWSTATUS",
        "options": [
          [
            "on",
            "on"
          ],
          [
            "off",
            "off"
          ]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 180,
    "tooltip": "Changes HA thing sensor value",
    "helpUrl": ""
  }, 
  blockSwitchEvent: {
    "type": "ha_on_switch",
    "message0": "on new  %1 command %2 command %3 %4 %5",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "thing1Name",
            "thing1"
          ],
          [
            "thing2Name",
            "thing2"
          ]
        ]
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "field_variable",
        "name": "VAR",
        "variable": "state"
      },
      {
        "type": "input_dummy",
        "align": "RIGHT"
      },
      {
        "type": "input_statement",
        "name": "CMD"
      }
    ],
    "colour": 180,
    "tooltip": "Event fired when a new switch status is published",
    "helpUrl": ""
  }, 
  blockEnableThing: {
    "type": "ha_enable_thing",
    "message0": "%1 thing %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NEWSTATUS",
        "options": [
          [
            "enable",
            "enable"
          ],
          [
            "disable",
            "disable"
          ]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "thing1Name",
            "thing1"
          ],
          [
            "thing2Name",
            "thing2"
          ]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 180,
    "tooltip": "Changes HA thing sensor value",
    "helpUrl": ""
  }
}