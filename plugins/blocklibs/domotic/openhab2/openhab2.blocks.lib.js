'use strict';

module.exports = {
  onItemState: {
    "type": "oh_on_item_state",
    "message0": "When OpenHab2 thing %1 has a new state %2 Channel: %3 %4 New value: %5 %6 %7",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "op1",
            "OPTIONNAME"
          ],
          [
            "op2",
            "OPTIONNAME"
          ],
          [
            "op3",
            "OPTIONNAME"
          ]
        ]
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "field_variable",
        "name": "CHANNEL",
        "variable": "channel"
      },
      {
        "type": "input_dummy",
        "align": "RIGHT"
      },
      {
        "type": "field_variable",
        "name": "VALUE",
        "variable": "value"
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
    "colour": "#FF6600",
    "tooltip": "Thrown when an OpenHab2 thing channel changed to a new value",
    "helpUrl": ""
  }, 
  onChannelState: {
    "type": "oh_on_channel_state",
    "message0": "When OpenHab2 channel %1 has a changed %2 New value: %3 %4 %5",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "op1",
            "OPTIONNAME"
          ],
          [
            "op2",
            "OPTIONNAME"
          ],
          [
            "op3",
            "OPTIONNAME"
          ]
        ]
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "field_variable",
        "name": "VALUE",
        "variable": "value"
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
    "colour": "#FF6600",
    "tooltip": "Thrown when an OpenHab2 thing channel value changed to a new value",
    "helpUrl": ""
  }, 
  onItemStateChanged: {
    "type": "oh_on_item_state_changed",
    "message0": "When OpenHab2 thing %1 has a changed %2 Channel: %3 %4 Old value: %5 %6 New value: %7 %8 %9",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "op1",
            "OPTIONNAME"
          ],
          [
            "op2",
            "OPTIONNAME"
          ],
          [
            "op3",
            "OPTIONNAME"
          ]
        ]
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "field_variable",
        "name": "CHANNEL",
        "variable": "channel"
      },
      {
        "type": "input_dummy",
        "align": "RIGHT"
      },
      {
        "type": "field_variable",
        "name": "OLDVALUE",
        "variable": "oldValue"
      },
      {
        "type": "input_dummy",
        "align": "RIGHT"
      },
      {
        "type": "field_variable",
        "name": "VALUE",
        "variable": "value"
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
    "colour": "#FF6600",
    "tooltip": "Thrown when an OpenHab2 thing channel value has changed",
    "helpUrl": ""
  }, 
  onChannelStateChanged: {
    "type": "oh_on_channel_state_changed",
    "message0": "When OpenHab2 thing %1 has a changed %2 Old value: %3 %4 New value: %5 %6 %7",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "op1",
            "OPTIONNAME"
          ],
          [
            "op2",
            "OPTIONNAME"
          ],
          [
            "op3",
            "OPTIONNAME"
          ]
        ]
      },
      {
        "type": "input_dummy"
      },
      {
        "type": "field_variable",
        "name": "OLDVALUE",
        "variable": "oldValue"
      },
      {
        "type": "input_dummy",
        "align": "RIGHT"
      },
      {
        "type": "field_variable",
        "name": "VALUE",
        "variable": "value"
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
    "colour": "#FF6600",
    "tooltip": "Thrown when an OpenHab2 thing channel value changed to a new value",
    "helpUrl": ""
  }, 
  getThingChannels: {
    "type": "oh_get_thing_channels",
    "message0": "get channels from thing %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "THING",
        "options": [
          [
            "op1",
            "OPTIONNAME"
          ],
          [
            "op2",
            "OPTIONNAME"
          ],
          [
            "op3",
            "OPTIONNAME"
          ]
        ]
      }
    ],
    "output": null,
    "colour": "#FFAA00",
    "tooltip": "Returns channel list from a given thing",
    "helpUrl": ""
  }, 
  getThingChannelsParam: {
    "type": "oh_get_thing_channels_param",
    "message0": "get channels from thing %1",
    "args0": [
      {
        "type": "input_value",
        "name": "THING",
        "check": "String"
      }
    ],
    "output": null,
    "colour": "#FFAA00",
    "tooltip": "Returns channel list from a given thing",
    "helpUrl": ""
  }, 
  getChannelProperty: {
    "type": "oh_get_channel_property",
    "message0": "get property %1 from channel %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          [
            "label",
            "LABEL"
          ],
          [
            "thing",
            "THING"
          ],
          [
            "properties",
            "PROPERTIES"
          ],
          [
            "configuration",
            "CONFIGURATION"
          ],
          [
            "id",
            "UID"
          ],
          [
            "default tags",
            "DEFAULTTAGS"
          ],
          [
            "kind",
            "KIND"
          ],
          [
            "item type",
            "ITEMTYPE"
          ]
        ]
      },
      {
        "type": "input_value",
        "name": "CHANNEL",
        "check": "String"
      }
    ],
    "output": null,
    "colour": "#FFAA00",
    "tooltip": "Returns a channel property",
    "helpUrl": ""
  }
}