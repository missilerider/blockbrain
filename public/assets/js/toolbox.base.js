[
  {
    "category": "Logic",
    "colour": "#5C81A6",
    "children": [
      { "block": "controls_if" },
      {
        "block": "logic_compare",
        "children": [
          { "field": "OP", "value": "EQ" }
        ]
      },
      {
        "block": "logic_operation",
        "children": [
          { "field": "OP", "value": "AND" }
        ]
      },
      { "block": "logic_negate" },
      {
        "block": "logic_boolean",
        "children": [
          { "field": "BOOL", "value": "TRUE" }
        ]
      },
      { "block": "logic_null" },
      { "block": "logic_ternary" }
    ]
  },
  {
    "category": "Loops",
    "colour": "#5CA65C",
    "children": [
      {
        "block": "controls_repeat_ext",
        "children": [
          {
            "value": "times",
            "children": [
              {
                "shadow": "math_number",
                "children": [
                  { "field": "NUM", "value": "10" }
                ]
              }
            ]
          }
        ]
      },
      {
        "block": "controls_whileUntil",
        "children": [
          { "field": "MODE", "value": "WHILE" }
        ]
      },
      {
        "block": "controls_for",
        "children": [
          { "field": "VAR", "id": "_D`J=xFTvW;n@mPqe#Sx", "variabletype": "", "value": "i" },
          {
            "value": "FROM",
            "children": [
              {}
            ]
          }
        ]
      }
    ]
  }
]
