'use strict';

const express = require('express');
const helmet = require('helmet');
var util = require('util');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

const log = require('./log.js');
global.log = log;

const utils = require('./utils.js');
const serverApi = require('./serverApi.js');
const serverDyn = require('./serverDyn.js');

var plugins = require('./plugins.js');
var services = require('./services.js');

log.d("Server start");

var conf = utils.loadConfig();
var globalSetup = {
  config: conf,
  plugins: plugins,
  services: services,
  utils: utils
};

utils.config(globalSetup);
services.config(globalSetup);
serverApi.config(globalSetup);
serverDyn.config(globalSetup);

console.dir(conf);

var runtime = {
  apiKeys: {
    "abc": {
      enabled: true,
      permissions: {
        dev: true
      }
    }
  }
};

// Constants
const PORT = conf.endpoint.port;
const HOST = conf.endpoint.bind;

// App
const app = express();

app.use(helmet());

app.use(cookieParser(conf.security.cookie.secret));
app.use(expressSession({
  secret: conf.security.cookie.secret,
  key:conf.security.cookie.name,
  cookie: {
    path: '/',
    httpOnly: false,
    secure: false,
    maxAge: null
  },
  resave: false,
  saveUninitialized: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

function checkAuth(req, res, next, done) {
  if(req.session)
    if(req.session.user)
      return done(req, res, next);

  if(req.headers && req.headers['x-blockbrain-api-key'])
    if(runtime.apiKeys[req.headers['x-blockbrain-api-key']] &&
      runtime.apiKeys[req.headers['x-blockbrain-api-key']].enabled) {
        return done(req, res, next);
      }

  res.redirect(302, '/login.html?last=' + encodeURIComponent(req.url));
  res.end();
  return false;
}

app.get('/logoff.run', (req, res, next) => {
  req.session.user = null;
  res.redirect(302, '/login.html');
  res.end();
});

app.post('/login.run', (req, res, next) => {
  var username = req.body.user;
  var password = req.body.pwd;
  var last = req.body.last;
  password = utils.sha256(password.valueOf());

  console.log("User: " + username);
  console.log("Pwd: " + password);

  for(var n = 0; n < conf.security.users.length; n++) {
    var u = conf.security.users[n];
    console.log("Check: " + u.name + " / " + u.sha256);
    if (username.valueOf() === u.name && password.valueOf() === u.sha256) {
      req.session.user = {
        user: u
      }
      res.redirect(302, last ? last : "/index.html");
      res.end();
      return;
    }
  }
  res.redirect(302, '/login.html');
  req.session.user = null;
});

app.get('/', (req, res, next) => { res.redirect(301, '/index.html'); });

// API calls
app.use('/api/v1/*', (req, res, next) =>  {
  checkAuth(req, res, next, serverApi.dispatcher);
});

app.post('/endpoint', utils.endpoint);

app.use('/assets/dyn/blockLoader.js', serverDyn.blockLoader);
app.use('/assets/dyn/blockTree.json', serverDyn.blockTree);
app.use('/assets/dyn/blocks.js', serverDyn.blocksJs);
app.use('/assets/dyn/blocks.json', serverDyn.blocks);
app.use('/assets/dyn/toolboxes.js', serverDyn.toolboxesJs);
app.use('/assets/dyn/toolboxes.json', serverDyn.toolboxesJson);

app.use('/blockly', express.static('blockly'));
app.use('/closure-library', express.static('closure-library'));
app.use('/login.html', express.static(__dirname + '/public/login.html'));
app.use('/assets', express.static('public/assets'));
app.use('/', function(req, res, next) {
  checkAuth(req, res, next, function(req, res, next) {
    const path = req.originalUrl.replace(/\?.*$/, '');
    console.log("Static ok: " + path  + " = " + __dirname + '/public' + path);
    try {
      res.sendFile(path, {root: __dirname + '/public'}, (err) => {
        res.end();

        if (err) res.status(404);
      });
    } catch(e) {
        res.status(404);
    }
  })
});

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// General load
plugins.reload().then(() => {
  // Starts automatic services
  log.i("Starting services on startup");
  Object.keys(conf.startupServices).forEach(id => {
    if(conf.startupServices[id])
      services.start(id);
  });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
