'use strict';

var logLevel = 53;

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
    case "0":
    case 0:
    case "":
    case "NONE": logLevel = 0; break;
    case "1":
    case 1:
    case "F":
    case "FATAL": logLevel = 1; break;
    case "2":
    case 2:
    case "E":
    case "ERROR": logLevel = 2; break;
    case "3":
    case 3:
    case "W":
    case "WARN":
    case "WARNING": logLevel = 3; break;
    case "4":
    case 4:
    case "I":
    case "INFO": logLevel = 4; break;
    case "5":
    case 5:
    case "D":
    case "DEBUG": logLevel = 5; break;
    default: doLog("Incorrect log level: " + newLevel, "WARN");
  }
}

function getLogLevel(newLevel) {
  const levels = [ "NONE", "FATAL", "ERROR", "WARNING", "INFO", "DEBUG" ];
  return levels[logLevel];
}

function dump(v, d) { if(logLevel >= 5) doLog(v + " = " + JSON.stringify(d, null, 2), "DUMP"); }
function d(t) { if(logLevel >= 5) doLog(t, "DEBUG"); }
function i(t) { if(logLevel >= 4) doLog(t, "INFO"); }
function w(t) { if(logLevel >= 3) doLog(t, "WARN"); }
function e(t) { if(logLevel >= 2) doLog(t, "ERROR"); }
function f(t) { if(logLevel >= 1) doLog(t, "FATAL"); }

module.exports = {
  setLogLevel: setLogLevel,
  getLogLevel: getLogLevel,
  dump: dump,
  d: d,
  i: i,
  w: w,
  e: e,
  f: f
}
