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
        let msg = new Message(ret.result[n]);
        ret2.push(msg);

        if(msg.update_id >= this.nextUpdate_id)
          this.nextUpdate_id = msg.update_id + 1;
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

    this.doPostSync("sendMessage", {
      chat_id: params.chat_id,
      text: params.text,
      parse_mode: 'Markdown'
    })
  }
}

class Message {
  constructor(params) {
    this.update_id = params.update_id || undefined;
    this.message_id = params.message.message_id || undefined;

    if('from' in params.message)
      this.from = new User(params.message.from);
      else {
        console.log("mensaje sin from!");
        console.dur(params.message);
      }

    if('chat' in params.message)
      this.chat = new Chat(params.message.chat);
    else {
      console.log("mensaje sin chat!");
      console.dir(params.message);
    }

    this.setDate(params.message.date);

    if('text' in params.message) {
      this.text = params.message.text;

      let cmds = [];
      let prevCmd = null;
      let lastEnd = -1;
      if('entities' in params.message) {
        for(let n = 0; n < params.message.entities.length; n++) {
          let ent = params.message.entities[n];
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

    if('document' in params.message)
      this.document = new Document(params.message.document);

  }

  setDate(utc) {
    this.date = new Date(0);
    this.date.setUTCSeconds(utc);
  }

  isText() {

  }
}

class User {
  constructor(params) {
    this.id = params.id || undefined;
    this.is_bot = params.is_bot || undefined;
    this.first_name = params.first_name || undefined;
    this.last_name = params.last_name || undefined;
    this.username = params.username || undefined;
    this.language_code = params.language_code || undefined;
  }
}

class Chat {
  constructor(params) {
    this.id = params.id || undefined;
    this.first_name = params.first_name || undefined;
    this.last_name = params.last_name || undefined;
    this.username = params.username || undefined;
    this.type = params.type || undefined;
  }
}

class Document {
  constructor(params) {
    this.file_name = params.file_name || undefined;
    this.file_id = params.file_id || undefined;
    this.file_size = params.file_size || undefined;
  }
}

module.exports = {
  Bot: Bot
}
