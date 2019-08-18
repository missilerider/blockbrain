const fs = require('fs');
const telegram = require('./telegramWrapper.lib.js');
const log = global.log;

const blocks = require('./telegramBlocks.lib.js');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

var bot = undefined;

function getInfo(env) {
  return {
    "id": "telegram",
    "name": "Telegram Service Library",
    "author": "Alfonso Vila"
  }
}

var telegramService = {
  getInfo: () => { return {
    methods: ["start", "stop", "status"],
    name: "Telegram Service",
    description: "Integrates with Telegram as a bot account"

  }},
  status: () => { return "TODO"; },
  start: (srv) => {
    serviceConfig = srv.config;

    // Preloads keys and values if necesary
    if(serviceConfig.persistence) {
//      log.d("Loads saved keys");
//      loadKeys(serviceConfig);
    }

    return true;
  },
  stop: (srv) => {
    serviceConfig = srv.config;
  },
  run: async (srv, tools) => {
    serviceConfig = srv.config;

    bot = new telegram.Bot({
      token: serviceConfig.token,
      pollingTimeout: serviceConfig.pollingTimeout
    });

    srv.status = 1;

    while(!srv.stop) {
      let msg = await bot.getUpdates();
      for(let n = 0; n < msg.length; n++) {
        if('text' in msg[n]) {
          log.d("Telegram text: " + msg[n].text);
          await tools.executeEvent('telegram.telegram_text', {
            text: msg[n].text,
            message: msg[n]
          });
        }

        if('commands' in msg[n]) {
          for(let c = 0; c < msg[n].commands.length; c++) {
            log.d("Telegram command: " + msg[n].commands[n].command);
            await tools.executeEvent('telegram.telegram_cmd', {
              command: msg[n].commands[c].command,
              params: msg[n].commands[c].params,
              message: msg[n]
            });
          }
        }

        if('document' in msg[n]) {
          log.d("Telegram document: " + msg[n].document.file_name);
          await tools.executeEvent('telegram.telegram_document', {
            file_name: msg[n].document.file_name,
            message: msg[n]
          });
        }
      }
    }

    srv.status = 0;
  }
}

var telegramTextBlock = {
  "block": blocks.telegramTextBlock,
  "run": async (context) => {
    var rgx = context.getField('RGX');
    try {
      if(context.getVar('msg').text.match(rgx))
        return await context.continue("CMD");
    } catch(e) {
      log.e("Regular expression error: " + e.message);
    }
  }
};

var telegramCmdBlock = {
  "block": blocks.telegramCmdBlock,
  "run": async (context) => {
    var rgx = context.getField('RGX');
    try {
      if(context.getVar('msg').command.match(rgx))
        return await context.continue("CMD");
    } catch(e) {
      log.e("Regular expression error: " + e.message);
    }
  }
};

var telegramDocumentBlock = {
  "block": blocks.telegramDocumentBlock,
  "run": async (context) => {
    var rgx = context.getField('RGX');
    try {
      if(context.getVar('msg').file_name.match(rgx))
        return await context.continue("CMD");
    } catch(e) {
      log.e("Regular expression error: " + e.message);
    }
  }
};

var telegramSendTextBlock = {
  "block": blocks.telegramSendTextBlock,
  "run": async (context) => {
    let chat = context.getField("CHAT");
    let text = await context.getValue("TEXT");

    switch(chat) {
      case "CURRENT":
        await bot.sendMessage({
          chat_id: context.getVar('msg').message.chat.id,
          text: text
        });
        break;

        case "ADMINS":
          await bot.sendMessage({
            chat_id: context.getVar('msg').message.chat.id,
            text: "ADMIN: " + text
          });
          break;
    }
/*    var rgx = context.getField('RGX');
    try {
      if(context.getVar('msg').file_name.match(rgx))
        return await context.continue("CMD");
    } catch(e) {
      log.e("Regular expression error: " + e.message);
    }*/
  }
};

function getBlocks() {
  return {
    "telegram_text": telegramTextBlock,
    "telegram_cmd": telegramCmdBlock,
    "telegram_document": telegramDocumentBlock,
    "telegram_send_text": telegramSendTextBlock
  };
}

function getServices() {
  return { "telegram": telegramService };
}

function getToolbox() {
  return {
    "telegram": {
      "Events": '<block type="telegram.telegram_text"></block> \
                <block type="telegram.telegram_cmd"></block> \
                <block type="telegram.telegram_document"></block>',
      "Functions":
        '<block type="telegram.telegram_send_text"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: getServices,
  getToolbox: getToolbox
}
