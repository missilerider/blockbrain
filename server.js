'use strict';

process.on('warning', (warning) => {
  console.log(warning.stack);
});

const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

const debug = require('debug')('blockbrain');
const Log = require('./log.js');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

global.config_path = process.env.CONFIG_PATH || "./config";
global.vault_path = process.env.VAULT_PATH || "./vault";

debug(`Config path = ${global.vault_path}`);
debug(`Vault path = ${global.vault_path}`);

const log = Log.newLogger();
const slog = Log.newLogger("S =>\t");
global.log = log;
global.slog = slog;

log.setLogLevel("WARN");

const utils = require('./utils.js');
const serverApi = require('./serverApi.js');
const serverDyn = require('./serverDyn.js');

var plugins = require('./plugins.js');
var services = require('./services.js');
const ca = require('./ca.js');
const { config } = require('process');
const { endpoint } = require('./utils.js');

var conf = utils.loadConfig();
var server = {};

log.setLogLevel(conf.system.log.level);
log.setLogOutput(conf.system.log.stdout);
slog.setLogLevel(conf.system.scriptLog.level);
slog.setLogOutput(conf.system.log.stdout);

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

var globalSetup = {
  config: conf,
  plugins: plugins,
  services: services,
  utils: utils, 
  server: server, 
  runtime: runtime
};

utils.config(globalSetup);
services.config(globalSetup);
serverApi.config(globalSetup);
serverDyn.config(globalSetup);
ca.init(globalSetup);

debug("Server start");

// Constants
const PORT = conf.endpoint.port;
const HOST = conf.endpoint.bind;

// App
const app = express();

app.use(helmet());

app.use(cookieParser(conf.security.cookie.secret));
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
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

function checkAuth(req, res, next, done, errRedirect = true) {
  if (req.session)
    if (req.session.user)
      return done(req, res, next);

  if (req.headers && req.headers['x-blockbrain-api-key'])
    if (runtime.apiKeys[req.headers['x-blockbrain-api-key']] &&
      runtime.apiKeys[req.headers['x-blockbrain-api-key']].enabled) {
      return done(req, res, next);
    }

  if (errRedirect) {
    res.redirect(302, '/login.html?last=' + encodeURIComponent(req.url));
    res.end();
    return false;
  } else {
    res.status(401).send({ message: 'Authorization needed. Please refer to the user manual' });
    return false;
  }
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

  debug("User: " + username);
  debug("Pwd: " + password);

  for (var n = 0; n < conf.security.users.length; n++) {
    var u = conf.security.users[n];
    debug("Check: " + u.name + " / " + u.sha256);
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
app.use('/api/v1/*', (req, res, next) => {
  checkAuth(req, res, next, serverApi.dispatcher, false);
});

app.use('/assets/dyn/*', serverDyn.dispatcher);

app.use('/blockly', express.static('blockly'));
app.use('/closure-library', express.static('closure-library'));
app.use('/login.html', express.static(__dirname + '/public/login.html'));
app.use('/assets', express.static('public/assets'));

// Almost last and least
app.all('/' + conf.endpoint.path + '*', (req, res, next) => {
  checkAuth(req, res, next, utils.endpoint, false);
});

// Static resources
app.use('/', function (req, res, next) {
  checkAuth(req, res, next, function (req, res, next) {
    const path = req.originalUrl.replace(/\?.*$/, '');

    if(fs.existsSync(`./public${path}`)) {
      debug("Static: " + path + " = " + __dirname + '/public' + path);
      try {
        res.sendFile(path, { root: __dirname + '/public' }, (err) => {
          res.end();

          if (err) res.status(404);
        });
      } catch (e) {
        res.status(404);
      }
    } else {
      next();
    }
  });
});


// HTTP(S) server
if(conf.endpoint.https && conf.endpoint.https.enabled) {
  if(!fs.existsSync(conf.endpoint.https.serverKey) ||  
    !fs.existsSync(conf.endpoint.https.serverCert)) {

    // Cert files errors...
    if(!conf.endpoint.https.generateCertificate) {
      log.f("Could not load cert+key. Cannot start https. Aborting now");
      process.exit();
    }

    log.i("Could not load cert+key for https");

    if(!ca.isEnabled) {
      log.e("Local CA not started. Cannot generate server certificate. Aborting nows");
      process.exit();
    }

    let cn = [ ];
    if(conf.endpoint.domainName) cn = Array.isArray(conf.endpoint.domainName) ? conf.endpoint.domainName : [conf.endpoint.domainName];
    else cn = [ca.cn];

    cn = [ ...cn, ...utils.getIps() ];

    let cert = ca.generateCertificate({
      cn: cn, 
      c: ca.c, 
      st: ca.st, 
      l: ca.l, 
      o: ca.o, 
      ou: ca.ou
    });

    try {
      fs.writeFileSync(conf.endpoint.https.serverKey, cert.privateKey);
      fs.writeFileSync(conf.endpoint.https.serverCert, cert.certificate + ca.cert);
    } catch {
      log.f(`Could not write generated cert files to ${conf.endpoint.https.serverKey} and ${conf.endpoint.https.serverCert} Aborting now`);
      process.exit();
    }
  }

  var https = require('https');
  server.server = https.createServer({
    key: fs.readFileSync(conf.endpoint.https.serverKey),
    cert: fs.readFileSync(conf.endpoint.https.serverCert)
  }, app).listen(PORT, HOST, () => {
    debug(`Running on https://${HOST}:${PORT}`);
  });

  server.app = app;
  server.secure = true;

} else {

  server.server = app.listen(PORT, HOST, () => {
    debug(`Running on http://${HOST}:${PORT}`);
  });

  server.app = app;
  server.secure = false;
}

// General load
plugins.reload(utils).then(() => {
  // Starts automatic services
  var srvs = services.getServices();

  debug("Starting services on startup");
  Object.keys(conf.startupServices).forEach(id => {
    if (conf.startupServices[id]) {
      services.start(id);
    }
  });

  // Preloads every script
  try {
    debug(`Script pre-load start (${conf.blocks.path})`);
    utils.scriptReload(conf.blocks.path).then(() => {
      debug("Script pre-load ended");
    }).catch((e) => {
      log.e("scriptReload");
      log.e(e.message);
      log.e(e.stack);
    })
  } catch (e) {
    log.e(e.message);
  }
});

// Graceful exit
process.on('SIGINT', async function () {
  console.log("SIGINT received");
  debug("SIGINT received");
  log.f("Blockbrain is closing!");
  debug("Stopping HTTP server...");
  await server.server.close();

  for (let s = 0; s < Object.keys(services.getServices()).length; s++) {
    let id = Object.keys(services.getServices())[s];
    if (
      services.status(id).status == "running") {
      debug("Stopping service " + id + "...");
      await services.stop(id);
    }
  }

  await sleep(1000);

  debug("Important tasks stopped. Closing");

  // The rest is dead crap
  process.exit();
});
