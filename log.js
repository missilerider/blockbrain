'use strict';

var colors = require('colors');

function newLogger(prefix) {
  return new Log(prefix);
}

function Log(prefix = "") {
  this.logLevel = 2;
  this.output = true;
  this.prefix = prefix;
}

Log.prototype.doLog = function(t, context) {
  if(typeof t !== 'object') {
    if(this.output) console.log(this.prefix + "[" + context + "]\t" + t);
  } else {
    if(this.output) {
      console.log(this.prefix + "[" + context + "]:");
      console.log(this.prefix + JSON.stringify(t) + "\n");
    }
  }
};

Log.prototype.setLogLevel = function(newLevel) {
  switch(newLevel) {
    case "0":
    case 0:
    case "":
    case "NONE": this.logLevel = 0; break;
    case "1":
    case 1:
    case "F":
    case "FATAL": this.logLevel = 1; break;
    case "2":
    case 2:
    case "E":
    case "ERROR": this.logLevel = 2; break;
    case "3":
    case 3:
    case "W":
    case "WARN":
    case "WARNING": this.logLevel = 3; break;
    case "4":
    case 4:
    case "I":
    case "INFO": this.logLevel = 4; break;
    case "5":
    case 5:
    case "D":
    case "DEBUG": this.logLevel = 5; break;
    default: this.doLog("Incorrect log level: " + this.newLevel, "WARN");
  }
};

Log.prototype.setLogOutput = function(newOutput) {
  this.output = newOutput;
}

Log.prototype.getLogLevel = function() {
  const levels = [ "NONE", "FATAL", "ERROR", "WARNING", "INFO", "DEBUG" ];
  return levels[this.logLevel];
};

Log.prototype.obj = function(v, d) { if(this.logLevel >= 5) this.doLog(v.green + " = " + JSON.stringify(Object.getOwnPropertyNames(d), null, 2).brightGreen, "OBJ".black.bgGreen); }
Log.prototype.dump = function(v, d) { if(this.logLevel >= 5) this.doLog(v.green + " = " + JSON.stringify(d, null, 2).brightGreen, "DUMP".black.bgGreen); }
Log.prototype.d = function(t) { if(this.logLevel >= 5) this.doLog(t.cyan, "DEBUG".bgCyan.black); }
Log.prototype.i = function(t) { if(this.logLevel >= 4) this.doLog(t.brightWhite, "INFO".bgBrightWhite.black); }
Log.prototype.w = function(t) { if(this.logLevel >= 3) this.doLog(t.brightYellow, "WARN".bgBrightYellow.black); }
Log.prototype.e = function(t) { if(this.logLevel >= 2) this.doLog(t.brightRed, "ERROR".bgBrightRed.black); }
Log.prototype.f = function(t) { if(this.logLevel >= 1) this.doLog(t.bgBrightRed.black.bold, "FATAL".brightRed.bold); }

Log.prototype.p = function(t) { this.doLog(t.bold, "OUT".bold); }

module.exports = {
  newLogger: newLogger
/*  setLogLevel: setLogLevel,
  getLogLevel: getLogLevel,
  setScriptLogLevel: setScriptLogLevel, 
  getScriptLogLevel: getScriptLogLevel, 
  dump: dump,
  d: d,
  i: i,
  w: w,
  e: e,
  f: f, */
}
