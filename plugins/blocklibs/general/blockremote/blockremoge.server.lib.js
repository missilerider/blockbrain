'use strict';

const express = require('express');
const helmet = require('helmet');
var bodyParser = require('body-parser');

const app = express();

const debug = require('debug')('blockbrain:service:blockremote');

app.use(helmet());

/*app.use(cookieParser(conf.security.cookie.secret));
app.use(expressSession({
  secret: conf.security.cookie.secret,
  key: conf.security.cookie.name,
  cookie: {
    path: '/',
    httpOnly: false,
    secure: false,
    maxAge: null
  },
  resave: false,
  saveUninitialized: true
}));
/*app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(methodOverride());

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

        this.server = app.listen(params.port, params.host);
        debug(`Running on http://${params.host}:${params.port}`);

        this.started = true;
    }

    stop() {
        if(!this.started) return;

        this.server.close();
        this.started = false;
    }

    receives(req, res) {

    }
}

module.exports = new blockremoteServer();