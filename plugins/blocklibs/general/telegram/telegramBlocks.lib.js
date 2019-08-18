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

module.exports = {
  telegramTextBlock: telegramTextBlock,
  telegramCmdBlock: telegramCmdBlock,
  telegramDocumentBlock: telegramDocumentBlock,
  telegramSendTextBlock: telegramSendTextBlock
}
