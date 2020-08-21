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
    }
}