module.exports = {
    fn: {
      "type": "fn_fn",
      "message0": "function name %1 ( %2 ) %3 %4 tooltip %5 %6 params %7 body %8 returns %9",
      "args0": [
        {
          "type": "field_input",
          "name": "FUNCTION",
          "text": "default"
        },
        {
          "type": "field_input",
          "name": "SECTION",
          "text": "User functions"
        },
        {
          "type": "field_colour",
          "name": "COLOR",
          "colour": "#ff0000"
        },
        {
          "type": "input_dummy"
        },
        {
          "type": "field_input",
          "name": "DESCRIPTION",
          "text": "User functions"
        },
        {
          "type": "input_dummy"
        },
        {
          "type": "input_statement",
          "name": "PARAMS",
          "check": "fn_param",
          "align": "RIGHT"
        },
        {
          "type": "input_statement",
          "name": "BODY",
          "align": "RIGHT"
        },
        {
          "type": "input_statement",
          "name": "RETURN",
          "check": "fn_return",
          "align": "RIGHT"
        }
      ],
      "colour": "#222222",
      "tooltip": "User defined function",
      "helpUrl": ""
    }, 
    fn_param: {
      "type": "fn_param",
      "lastDummyAlign0": "RIGHT",
      "message0": "parameter %1 %2 variable %3",
      "args0": [
        {
          "type": "field_variable",
          "name": "NAME",
          "variable": "variableName"
        },
        {
          "type": "input_dummy"
        },
        {
          "type": "field_checkbox",
          "name": "ISVAR",
          "checked": true
        }
      ],
      "previousStatement": "fn_param",
      "nextStatement": "fn_param",
      "colour": 300,
      "tooltip": "Function parameter",
      "helpUrl": ""
    }, 
    fn_return: {
      "type": "fn_return",
      "message0": "variable %1",
      "args0": [
        {
          "type": "field_variable",
          "name": "NAME",
          "variable": "default"
        }
      ],
      "previousStatement": "fn_return",
      "nextStatement": "fn_return",
      "colour": 285,
      "tooltip": "Function return variables",
      "helpUrl": ""
    }
}