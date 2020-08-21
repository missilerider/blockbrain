'use strict';

const axios = require('axios');

class Bot {
  constructor(params) {
    if(!params.token) {
      throw new Error("Parameters required: Token");
    }

    this.token = params.token;
    this.pollingTimeout = params.pollingTimeout || 30;

    this.nextUpdate_id = 0;
  }

  async doPostSync(func, params) {
    let ret = await axios.post(`https://api.telegram.org/bot${this.token}/${func}`, params)
      .then((res) => {
        return res;
      })
      .catch((e) => {
        throw e;
        throw new Error("Could not reach Telegram!");
      });

    return ret.data;
  }

  async getMe() {
    return this.doPostSync("getMe", {});
  }

  async getUpdates() {
    let params = {
      timeout: this.pollingTimeout
    };

    if(this.nextUpdate_id) params.offset = this.nextUpdate_id;

    let ret = await this.doPostSync("getUpdates", params);

    let ret2 = [];

    //this.data = ret;

    let prevUpdate_id = this.nextUpdate_id;

    if(ret.ok) {
      ret2.messages = [];

  /*    // Sorts messages
      if(ret.ok && ('result' in ret) && ret.result.length > 1) {
        ret.result.sort((a, b) => {
          if(a.update_id < b.update_id) return -1;
          if(a.update_id > b.update_id) return 1;
          return 0;
        });
      }*/

      for(let n = 0; n < ret.result.length; n++) {
        let msg;

        if('message' in ret.result[n])
          msg = new Message(ret.result[n].message);
        else if('callback_query' in ret.result[n])
          msg = new CallbackQuery(ret.result[n].callback_query);

        ret2.push(msg);

        if(ret.result[n].update_id >= this.nextUpdate_id)
          this.nextUpdate_id = ret.result[n].update_id + 1;
      }
    }

    // If no message received, next time "receive all"
    if(prevUpdate_id == this.nextUpdate_id)
      this.nextUpdate_id = 0;

    return ret2;
  }

  async sendMessage(params) {
    if(!params.chat_id || !params.text)
      throw new Error("chat_id and text are mandatory");

    if(!('parse_mode' in params))
      params.parse_mode = 'Markdown';

    debug("Telegram sendMessage" + JSON.stringify(params));

    this.doPostSync("sendMessage", params).catch(e => { log.e(e); });
  }

  async editMessageReplyMarkup(params) {
    debug("Telegram editMessageReplyMarkup" + JSON.stringify(params));
    this.doPostSync("editMessageReplyMarkup", params).catch(e => { log.e(e); });
  }
}

class Message {
  constructor(data) {
//    this.raw = data;

    this.message_id = data.message_id || undefined;

    if('from' in data)
      this.from = new User(data.from);
      else {
        log.e("Telegram message without FROM field!");
        debug("message" + JSON.stringify(data));
      }

    if('chat' in data)
      this.chat = new Chat(data.chat);
    else {
      log.e("Telegram message without CHAT field!");
      debug("message" + JSON.stringify(data));
  }

    this.setDate(data.date);

    if('text' in data && data.text) {
      this.text = data.text;

      let cmds = [];
      let prevCmd = null;
      let lastEnd = -1;
      if('entities' in data) {
        for(let n = 0; n < data.entities.length; n++) {
          let ent = data.entities[n];
          if(ent.type == "bot_command") {
            if(prevCmd) {
              let pTxt = this.text.substring(lastEnd + 1, ent.offset - 1);
              prevCmd.params = pTxt.split(" ");
            }

            let cmd = {};
            cmd.command = this.text.substring(ent.offset, ent.offset + ent.length);
            cmd.params = [];
            lastEnd = ent.offset + ent.length;

            cmds.push(cmd);
            prevCmd = cmd;
          }
        }

        if(prevCmd) {
          let pTxt = this.text.substring(lastEnd + 1, this.text.length);
          prevCmd.params = pTxt.split(" ");
        }

        if(cmds.length > 0) this.commands = cmds;
      }
    }

    if('document' in data)
      this.document = new Document(data.document);

  }

  setDate(utc) {
    this.date = new Date(0);
    this.date.setUTCSeconds(utc);
  }

  getType() { return "Message"; }
}

class CallbackQuery {
  constructor(data) {
//    this.raw = data;

    this.id = data.id;

    if('from' in data)
      this.from = new User(data.from);

    if('message' in data) {
      this.message = new Message(data.message);
      this.chat = this.message.chat;
    }

    this.inline_message_id = data.inline_message_id || undefined;
    this.chat_instance = data.chat_instance || undefined;
    this.data = data.data || undefined;
    this.game_short_name = data.game_short_name || undefined;
  }

  getType() { return "CallbackQuery"; }
}

class User {
  constructor(data) {
    this.id = data.id || undefined;
    this.is_bot = data.is_bot || undefined;
    this.first_name = data.first_name || undefined;
    this.last_name = data.last_name || undefined;
    this.username = data.username || undefined;
    this.language_code = data.language_code || undefined;
  }
}

class Chat {
  constructor(data) {
    this.id = data.id || undefined;
    this.first_name = data.first_name || undefined;
    this.last_name = data.last_name || undefined;
    this.username = data.username || undefined;
    this.type = data.type || undefined;
  }
}

class Document {
  constructor(data) {
    this.file_name = data.file_name || undefined;
    this.file_id = data.file_id || undefined;
    this.file_size = data.file_size || undefined;
  }
}

module.exports = {
  Bot: Bot,
  Message: Message,
  CallbackQuery: CallbackQuery
}
