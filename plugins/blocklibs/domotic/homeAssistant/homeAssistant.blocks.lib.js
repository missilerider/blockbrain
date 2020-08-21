'use strict';

module.exports = {
    onChange: {
        "type": "ha_on_change",
        "message0": "when item %1 changes %2 get new state on %3 %4 get old state on %5 %6 %7",
        "args0": [{
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
                "name": "NEWSTATE",
                "variable": "newState"
            },
            {
                "type": "input_dummy",
                "align": "RIGHT"
            },
            {
                "type": "field_variable",
                "name": "OLDSTATE",
                "variable": "oldState"
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
        "colour": 240,
        "tooltip": "Event fired when a new switch status is published",
        "helpUrl": ""
    },

    setState: {
        "type": "ha_set_state",
        "message0": "set %1 state to %2",
        "args0": [{
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
                "type": "input_value",
                "name": "NEWSTATE"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 240,
        "tooltip": "Manually set state of Home Assistant entity",
        "helpUrl": ""
    },

    getState: {
        "type": "ha_get_state",
        "message0": "get %1 state",
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
          }
        ],
        "output": null,
        "colour": 240,
        "tooltip": "Returns Home Assistant entity state",
        "helpUrl": ""
    },

    setAttributes: {
        "type": "ha_set_attributes",
        "message0": "set %1 state to %2 attributes to %3",
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
            "type": "input_value",
            "name": "NEWSTATE"
          },
          {
            "type": "input_value",
            "name": "NEWATTR",
            "align": "RIGHT"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 240,
        "tooltip": "Set Home Assitant entity state and attributes",
        "helpUrl": ""
    }, 

    getAttributes: {
        "type": "ha_get_attributes",
        "message0": "get %1 attributes",
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
          }
        ],
        "inputsInline": false,
        "output": null,
        "colour": 240,
        "tooltip": "Returns Home Assistant entity attributes",
        "helpUrl": ""
    }
}
