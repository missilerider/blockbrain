'use strict';

const debug = require('debug')('blockbrain:script:http');

const blocks = require('./http.blocks.lib.js');

async function getBlocks() {
  return {
    "http_endpoint": {
      "block": blocks.httpEndpoint,
      "run":
        async (context) => {
          var path = context.getField('PATH');
          if(path !== context.params.path) {
            debug(`Path does not match: ${path} !== ${context.params.path}`);
            return; // Not my path! Bail silently
          }

          context.blockIn();

          return await context.continue("CODE");
      }
    }, 
    "http_endpoint_get": {
      "block": blocks.httpEndpointGet,
      "run":
        async (context) => {
          var path = context.getField('PATH');
          if(path !== context.params.path) {
            debug(`Path does not match: ${path} !== ${context.params.path}`);
            return; // Not my path! Bail silently
          }
      
          context.blockIn();

          let variable = context.getField('PARAMS');
          context.setVar(variable, context.params.get);

          return await context.continue("CODE");
      }
    }, 
    "http_endpoint_post": {
      "block": blocks.httpEndpointPost,
      "run":
        async (context) => {
          var path = context.getField('PATH');
          if(path !== context.params.path) {
            debug(`Path does not match: ${path} !== ${context.params.path}`);
            return; // Not my path! Bail silently
          }
      
          context.blockIn();

          let variable = context.getField('PARAMS');
          context.setVar(variable, context.params.post);

          return await context.continue("CODE");
      }
    },
    "http_endpoint_extended": {
      "block": blocks.httpEndpointEx,
      "run":
        async (context) => {
          var path = context.getField('PATH');
          if(path !== context.params.path) {
            debug(`Path does not match: ${path} !== ${context.params.path}`);
            return; // Not my path! Bail silently
          }
      
          context.blockIn();

          let variable = context.getField('PARAMS');
          context.setVar(variable, context.params.post);

          return await context.continue("CODE");
      }
    },
    "http_response": {
      "block": blocks.httpResponse,
      "run":
        async (context) => {
          debug("Sending response");
          if(context.params.res !== null) {

            let res = context.params.res;
            context.params.res = null;

            var code = parseInt(context.getField('CODE'), 10) || 200;
            var body = await context.getValue('BODY');

            if(!body) { body = {} };

            if(code == 301 || code == 302) {
              res.redirect(code, body.toString());
              return;
            }

            if(Array.isArray(body) || (typeof body == 'object')) {
              res.status(code).json(body);
              return;
            } else {
              res.status(code).send(body.toString());
              return;
            }
          } else {
            log.w("HTTP response trying to response an already returned call or no HTTP call");
          }
        }
    }
  };
}

function getToolbox() {
  return {
    "default": {
      "Events": ' \
        <block type="http_endpoint"></block> \
        <block type="http_endpoint_get"></block> \
        <block type="http_endpoint_post"></block> \
        <block type="http_endpoint_extended"></block> \
        <block type="http_response"></block> \
        '
    }
  }
}

module.exports = {
  getBlocks: getBlocks,
  getToolbox: getToolbox
}
