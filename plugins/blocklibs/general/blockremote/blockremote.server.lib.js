'use strict';

const express = require('express');
const https = require('https');
const helmet = require('helmet');
var bodyParser = require('body-parser');
const fs = require('fs');

const ca = require('../../../../ca.js');

const app = express();

const debug = require('debug')('blockbrain:service:blockremote');

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var srv = null; // Singleton!!!

app.get('/api/v1/*', (req, res) => {
    srv.received(req, res);
});

class blockremoteServer {
    constructor() {
        srv = this; // Singleton!!!

        this.started = false;
        this.server = null;
    }

    start(params) {
        if(this.started) return;

        if(!fs.existsSync(params.serverKey) || !fs.existsSync(params.serverCert)) {
          if(!params.autogen) {
            log.f("blockremote cannot load certificate and key. Please enable auto cert gen!");
            return false;
          }

          log.i("blockremote cannot load certificate and key. Generating...");

          if(!ca.isEnabled) {
            log.f("CA must be enabled. Could not generate blockremmote https cert");
            return false;
          }

          let cn = [ ];
          if(params.domainName) cn = Array.isArray(params.domainName) ? params.domainName : [params.domainName];
          else cn = [ca.cn];
      
          cn = [ ...cn, ...params.utils.getIps() ];
      
          let cert = ca.generateCertificate({
            cn: cn, 
            c: ca.c, 
            st: ca.st, 
            l: ca.l, 
            o: ca.o, 
            ou: ca.ou
          });

          try {
            fs.writeFileSync(params.serverKey, cert.privateKey);
            fs.writeFileSync(params.serverCert, cert.certificate + ca.cert);
          } catch {
            log.f("Could not write cert files. Cannot start blockremote");
          }
        }

        let caCert = ca.cert.toString();

        this.server = https.createServer({
          key: fs.readFileSync(params.serverKey),
          cert: fs.readFileSync(params.serverCert), 
          requestCert: true, 
          rejectUnauthorized: true, 
          ca: [ caCert ]
        }, app).listen(params.port, params.host, () => {
          debug(`Running on https://${params.host}:${params.port}`);
        });
      
        this.started = true;

        return true;
    }

    stop() {
        if(!this.started) return;

        this.server.close();
        this.started = false;
    }

    received(req, res) {
      res.send("ok!");
    }
}

module.exports = new blockremoteServer();