telegramTextBlock = {
  "type": "telegram_text",
  "message0": "new telegram text message %1 regex %2 %3 %4",
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
  "colour": 195,
  "tooltip": "A new text message is received",
  "helpUrl": ""
};

telegramCmdBlock = {
  "type": "telegram_cmd",
  "message0": "new telegram command %1 regex %2 %3 %4",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "field_input",
      "name": "RGX",
      "text": "/sample[0-9]*"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "CMD"
    }
  ],
  "colour": 195,
  "tooltip": "A new text command is received",
  "helpUrl": ""
};

telegramCallbackQueryBlock = {
  "type": "telegram_callback_query",
  "message0": "telegram callback query %1 regex %2 %3 %4",
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
  "colour": 195,
  "tooltip": "An inline keyboard button is pressed",
  "helpUrl": ""
};

telegramDocumentBlock = {
  "type": "telegram_document",
  "message0": "new telegram document %1 regex filename %2 %3 %4",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "field_input",
      "name": "RGX",
      "text": "\\.(jpg|png|gif)$"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "CMD"
    }
  ],
  "colour": 195,
  "tooltip": "A new text document is received",
  "helpUrl": ""
};

telegramSendTextBlock = {
  "type": "telegram_send_text",
  "message0": "send telegram text %1 to %2",
  "args0": [
    {
      "type": "input_value",
      "name": "TEXT",
      "check": "String"
    },
    {
      "type": "field_dropdown",
      "name": "CHAT",
      "options": [
        [
          "current chat",
          "CURRENT"
        ],
        [
          "administrators",
          "ADMIN"
        ]
      ]
    }
  ],
  "inputsInline": false,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 195,
  "tooltip": "Sends a simple Telegram text message",
  "helpUrl": ""
};

telegramSendMessageExBlock = {
  "type": "telegram_send_message_ex",
  "message0": "send telegram message extended %1 chat id %2 text %3 %4 link previews %5 %6 notification %7 %8 reply to message id %9 interface options %10",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_value",
      "name": "CHAT",
      "check": "Number",
      "align": "RIGHT"
    },
    {
      "type": "field_dropdown",
      "name": "PARSE",
      "options": [
        [
          "Markdown",
          "MARKDOWN"
        ],
        [
          "HTML",
          "HTML"
        ]
      ]
    },
    {
      "type": "input_value",
      "name": "TEXT",
      "check": "String",
      "align": "RIGHT"
    },
    {
      "type": "field_dropdown",
      "name": "LINK_PREV",
      "options": [
        [
          "enabled",
          "ON"
        ],
        [
          "disabled",
          "OFF"
        ]
      ]
    },
    {
      "type": "input_dummy",
      "align": "RIGHT"
    },
    {
      "type": "field_dropdown",
      "name": "NOTIFICATION",
      "options": [
        [
          "enabled",
          "ON"
        ],
        [
          "disabled",
          "OFF"
        ]
      ]
    },
    {
      "type": "input_dummy",
      "align": "RIGHT"
    },
    {
      "type": "input_value",
      "name": "REPLY",
      "check": "Number",
      "align": "RIGHT"
    },
    {
      "type": "input_value",
      "name": "MARKUP",
      "check": [
        "telegram.ikm",
        "telegram.rkm",
        "telegram.rkr",
        "telegram.fr",
        "json"
      ],
      "align": "RIGHT"
    }
  ],
  "inputsInline": false,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 195,
  "tooltip": "Sends a Telegram message with additional options",
  "helpUrl": ""
};

telegramIkmBlock = {
  "type": "telegram_ikm",
  "message0": "inline keyboard %1 %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "ROWS",
      "check": "telegram.ikm.row"
    }
  ],
  "inputsInline": false,
  "output": "telegram.ikm",
  "colour": 225,
  "tooltip": "Sends a simple Telegram text message",
  "helpUrl": ""
};

telegramIkmRowBlock = {
  "type": "telegram_ikm_row",
  "message0": "inline keyboard row %1 %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "BUTTONS",
      "check": "telegram.ikm.button"
    }
  ],
  "inputsInline": false,
  "previousStatement": "telegram.ikm.row",
  "nextStatement": "telegram.ikm.row",
  "colour": 225,
  "tooltip": "Sends a simple Telegram text message",
  "helpUrl": ""
};

telegramIkmButtonBlock = {
  "type": "telegram_ikm_button",
  "message0": "IK button %1 %2 url %3 callback data %4",
  "args0": [
    {
      "type": "field_input",
      "name": "TEXT",
      "text": "label"
    },
    {
      "type": "input_dummy"
    },
    {
      "type": "input_value",
      "name": "URL",
      "check": "String",
      "align": "RIGHT"
    },
    {
      "type": "input_value",
      "name": "CALLBACK",
      "check": "String",
      "align": "RIGHT"
    }
  ],
  "inputsInline": false,
  "previousStatement": "telegram.ikm.button",
  "nextStatement": "telegram.ikm.button",
  "colour": 240,
  "tooltip": "Inserts a single inline keyboard button",
  "helpUrl": ""
};

telegramUpdateIkmBlock = {
  "type": "telegram_update_ikm",
  "message0": "update telegram inline keyboard markup %1 interface options %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_value",
      "name": "MARKUP",
      "check": [
        "telegram.ikm",
        "json"
      ],
      "align": "RIGHT"
    }
  ],
  "inputsInline": false,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 195,
  "tooltip": "Updates the current message with new interface markup options",
  "helpUrl": ""
};

module.exports = {
  telegramTextBlock: telegramTextBlock,
  telegramCmdBlock: telegramCmdBlock,
  telegramCallbackQueryBlock: telegramCallbackQueryBlock,
  telegramDocumentBlock: telegramDocumentBlock,
  telegramSendTextBlock: telegramSendTextBlock,
  telegramSendMessageExBlock: telegramSendMessageExBlock,
  telegramIkmBlock: telegramIkmBlock,
  telegramIkmRowBlock: telegramIkmRowBlock,
  telegramIkmButtonBlock: telegramIkmButtonBlock,
  telegramUpdateIkmBlock: telegramUpdateIkmBlock
}
