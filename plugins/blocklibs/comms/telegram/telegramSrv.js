const fs = require('fs');
const telegram = require('./telegramWrapper.lib.js');
const debug = require('debug')('blockbrain:service:telegram');
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

    if(serviceConfig.persistence) {
//      debug("Loads saved keys");
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
        if(msg[n] instanceof telegram.Message) {
          // Commands also contain 'text' and should not be executed in 'text'
          if('text' in msg[n] && !('commands' in msg[n])) {
            debug("Telegram text: " + msg[n].text + ' from chat ' + msg[n].chat.id);
            await tools.executeEvent('telegram.telegram_text', {
              text: msg[n].text,
              message: msg[n]
            });
          }

          if('commands' in msg[n]) {
            for(let c = 0; c < msg[n].commands.length; c++) {
              debug("Telegram command: " + msg[n].commands[c].command + ' from chat ' + msg[n].chat.id);
              await tools.executeEvent('telegram.telegram_cmd', {
                text: msg[n].text,
                command: msg[n].commands[c].command,
                params: msg[n].commands[c].params,
                message: msg[n]
              });
            }
          }

          if('document' in msg[n]) {
            debug("Telegram document: " + msg[n].document.file_name + ' from chat ' + msg[n].chat.id);
            await tools.executeEvent('telegram.telegram_document', {
              fileName: msg[n].document.file_name,
              message: msg[n]
            });
          }
        } else if(msg[n] instanceof telegram.CallbackQuery) {
          debug("Telegram callbackquery: " + msg[n].data + ' from chat ' + msg[n].chat.id);
          let params = {
            data: msg[n].data,
            callbackQuery: msg[n]
          };

          if('message' in msg[n]) {
            params.text = msg[n].message.text;
            params.chat = msg[n].message.chat;
          }

          await tools.executeEvent('telegram.telegram_callback_query', params);
        }
      }
    }

    srv.status = 0;
  }
}

var telegramTextBlock = {
  "block": blocks.telegramTextBlock,
  "run": async (context) => {
    context.blockIn();
    var rgx = context.getField('RGX');
    let matches = false;
    try {
      matches = context.getVar('msg').text.match(rgx);
    } catch(e) {
      log.e("Regular expression error: " + e.message);
      log.trace();
    }
    if(matches)
      return await context.continue("CMD");
  }
};

var telegramCmdBlock = {
  "block": blocks.telegramCmdBlock,
  "run": async (context) => {
    context.blockIn();
    var rgx = context.getField('RGX');
    let matches = false;
    try {
      matches = context.getVar('msg').text.match(rgx);
    } catch(e) {
      log.e("Regular expression error: " + e.message);
      log.trace(e);
    }
    if(matches)
      return await context.continue("CMD");
  }
};

var telegramCallbackQueryBlock = {
  "block": blocks.telegramCallbackQueryBlock,
  "run": async (context) => {
    context.blockIn();
    var rgx = context.getField('RGX');
    let matches = false;
    try {
      matches = context.getVar('msg').data.match(rgx);
    } catch(e) {
      log.e("Regular expression error: " + e.message);
      log.trace();
    }
    if(matches)
      return await context.continue("CMD");
  }
};

var telegramDocumentBlock = {
  "block": blocks.telegramDocumentBlock,
  "run": async (context) => {
    context.blockIn();
    var rgx = context.getField('RGX');
    let matches = false;
    try {
      matches = context.getVar('msg').fileName.match(rgx);
    } catch(e) {
      log.e("Regular expression error: " + e.message);
      log.trace();
    }
    if(matches)
      return await context.continue("CMD");
  }
};

var telegramSendTextBlock = {
  "block": blocks.telegramSendTextBlock,
  "run": async (context) => {
    context.blockIn();
    let chat = context.getField("CHAT");
    let text = await context.getValue("TEXT");

    switch(chat) {
      case "CURRENT":
        let msg = context.getVar('msg');
        let chatId = null;
        if('message' in msg) chatId = msg.message.chat.id;
        else if('callbackQuery' in msg) chatId = msg.callbackQuery.chat.id;

        if(chatId)
          await bot.sendMessage({
            chat_id: chatId,
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
  }
};

var telegramSendMessageExBlock = {
  "block": blocks.telegramSendMessageExBlock,
  "run": async (context) => {
    context.blockIn();
    let chat = await context.getValue("CHAT", -1);
    let parse = context.getField("PARSE");
    let text = await context.getValue("TEXT");
    let linkPrev = context.getField("LINK_PREV");
    let notification = context.getField("NOTIFICATION");
    let replyId = await context.getValue("REPLY", -1);
    let markup = await context.getValue("MARKUP", null);

    if(!Array.isArray(chat)) {
      let params = {
        chat_id: chat != -1 ? chat : context.getVar('msg').message.chat.id,
        text: text,
        parse_mode: parse,  // "Markdown" | "HTML"
        disable_web_page_preview: !linkPrev,
        disable_notification: !notification
      }
  
      if(replyId != -1) params.reply_to_message_id = replyId;
      if(markup !== null) params.reply_markup = JSON.stringify({
        inline_keyboard: markup
      });
  
      await bot.sendMessage(params);
    } else {
      for(let n = 0; n < chat.length; n++) {
        let params = {
          chat_id: chat[n], 
          text: text,
          parse_mode: parse,  // "Markdown" | "HTML"
          disable_web_page_preview: !linkPrev,
          disable_notification: !notification
        }
    
        if(markup !== null) params.reply_markup = JSON.stringify({
          inline_keyboard: markup
        });
    
        await bot.sendMessage(params);
      }
    }
  }
};

var telegramIkmBlock = {
  "block": blocks.telegramIkmBlock,
  "run": async (context) => {
    context.blockIn();
    context.telegram = { rows: [] };

    await context.continue("ROWS");

    let rows = context.telegram.rows;
    delete context.telegram;

    return rows;
  }
};

var telegramIkmRowBlock = {
  "block": blocks.telegramIkmRowBlock,
  "run": async (context) => {
    context.blockIn();
    context.telegram.row = [];
    await context.continue("BUTTONS");
    context.telegram.rows.push(context.telegram.row);
    delete context.telegram.row;
  }
};

var telegramIkmButtonBlock = {
  "block": blocks.telegramIkmButtonBlock,
  "run": async (context) => {
    context.blockIn();
    let text = context.getField("TEXT");
    let url = await context.getValue("URL", null);
    let callback = await context.getValue("CALLBACK", null);

    let button = {
      text: text
    };

    if(url !== null) button.url = url;
    if(callback !== null) button.callback_data = callback;

    context.telegram.row.push(button);
  }
};

var telegramUpdateIkmBlock = {
  "block": blocks.telegramUpdateIkmBlock,
  "run": async (context) => {
    context.blockIn();
    let msg = context.getVar('msg');
    if(('callbackQuery' in msg) && ('message' in msg.callbackQuery)) {
      let markup = await context.getValue("MARKUP");

      let chatId = msg.callbackQuery.message.chat.id;
      let messageId = msg.callbackQuery.message.message_id;

      await bot.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: JSON.stringify({
          inline_keyboard: markup
        })
      });
    }
  }
};

async function getBlocks() {
  debug("telegram getBlocks");
  return {
    "telegram_text": telegramTextBlock,
    "telegram_cmd": telegramCmdBlock,
    "telegram_callback_query": telegramCallbackQueryBlock,
    "telegram_document": telegramDocumentBlock,
    "telegram_send_text": telegramSendTextBlock,
    "telegram_send_message_ex": telegramSendMessageExBlock,
    "telegram_ikm": telegramIkmBlock,
    "telegram_ikm_row": telegramIkmRowBlock,
    "telegram_ikm_button": telegramIkmButtonBlock,
    "telegram_update_ikm": telegramUpdateIkmBlock
  };
}

function getToolbox() {
  return {
    "telegram": {
      "Events": '<block type="telegram.telegram_text"></block> \
                <block type="telegram.telegram_cmd"></block> \
                <block type="telegram.telegram_callback_query"></block> \
                <block type="telegram.telegram_document"></block>',
      "Functions":
        '<block type="telegram.telegram_send_text"></block> \
        <block type="telegram.telegram_send_message_ex"></block>',
      "Inline Keyboard":
        '<block type="telegram.telegram_ikm"></block> \
        <block type="telegram.telegram_ikm_row"></block> \
        <block type="telegram.telegram_ikm_button"></block> \
        <block type="telegram.telegram_update_ikm"></block>'
    }
  }
}

module.exports = {
  getInfo: getInfo,
  getBlocks: getBlocks,
  getServices: () => { return { "telegram": telegramService } },
  getToolbox: getToolbox
}
