'use strict';

const axios = require('axios');

class Bot {
  constructor(params) {
    if(!params.token) {
      throw new Error("Parameters required: Token");
    }

    this.token = params.token;
    this.pollingTimeout = params.pollingTimeout || 30;
  }

  async doPostSync(func, params) {
    let ret = await axios.post(`https://api.telegram.org/bot${this.token}/${func}`, params)
      .then((res) => {
        return res;
      })
      .catch(() => {
        throw new Error("Could not reach Telegram!");
      });

    return ret.data;
  }

  async getMe() {
    return this.doPostSync("getMe", {});
  }

  async getUpdates() {
    let ret = await this.doPostSync("getUpdates", {
      timeout: this.pollingTimeout
    });

/*    // Sorts messages
    if(ret.ok && ('result' in ret) && ret.result.length > 1) {
      ret.result.sort((a, b) => {
        if(a.update_id < b.update_id) return -1;
        if(a.update_id > b.update_id) return 1;
        return 0;
      });
    }*/

    return ret;
  }
}

module.exports = {
  Bot: Bot
}
