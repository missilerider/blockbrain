'use strict';

var logLevel = 5;

function doLog(t, context) {
  if(typeof t !== 'object') {
    console.log("[" + context + "]\t" + t);
  } else {
    console.log("[" + context + "]:");
    console.log(JSON.stringify(t) + "\n");
  }
}

function setLogLevel(newLevel) {
  switch(newLevel) {
    case "NONE": logLevel = 0; break;
    case "FATAL": logLevel = 1; break;
    case "ERROR": logLevel = 2; break;
    case "WARN":
    case "WARNING": logLevel = 3; break;
    case "INFO": logLevel = 4; break;
    case "DEBUG": logLevel = 5; break;
    default: doLog("Incorrect log level: " + newLevel, "WARN");
  }
}

function dump(v, d) { if(logLevel >= 5) doLog(v + " = " + JSON.stringify(d, null, 2), "DUMP"); }
function d(t) { if(logLevel >= 5) doLog(t, "DEBUG"); }
function i(t) { if(logLevel >= 4) doLog(t, "INFO"); }
function w(t) { if(logLevel >= 3) doLog(t, "WARN"); }
function e(t) { if(logLevel >= 2) doLog(t, "ERROR"); }
function f(t) { if(logLevel >= 1) doLog(t, "FATAL"); }

module.exports = {
  dump: dump,
  d: d,
  i: i,
  w: w,
  e: e,
  f: f
}
