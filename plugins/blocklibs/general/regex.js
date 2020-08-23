'use strict';

const debug = require('debug')('blockbrain:service:regex');
const sdebug = require('debug')('blockbrain:script:regex');
const log = global.log;

var regexTestBlock = {
    "block": {
        "type": "text_regex_test",
        "message0": "%1 matches regexp %2",
        "args0": [
            {
                "type": "input_value",
                "name": "TEXT",
                "check": "String"
            },
            {
                "type": "field_input",
                "name": "REGEX",
                "text": "^.*$"
            }
        ],
        "output": "Boolean",
        "colour": 150,
        "tooltip": "Returns true if given text matches regular expresion",
        "helpUrl": ""
    },
    "run":
    async (context) => {
        context.blockIn();
        
        var text = (await context.getValue("TEXT")).toString();
        var regexText = context.getField("REGEX");
        let regex;
        try {
            regex = new RegExp(regexText);
        } catch(e) {
            log.e(`Regular expression error: '${regexText}' (${e.message})`);
            return false;
        }
        
        sdebug(`Test ${text} against ${regexText}`);
        return regex.test(text);
    }
}

var regexExtractRegexBlock = {
    "block": {
        "type": "text_extract_regex",
        "message0": "execute regexp %1 on %2",
        "args0": [
            {
                "type": "field_input",
                "name": "REGEX",
                "text": "^.*$"
            },
            {
                "type": "input_value",
                "name": "TEXT",
                "check": "String"
            }
        ],
        "output": "Array",
        "colour": 150,
        "tooltip": "Executes a regular expression and returns an array with the extractions or null",
        "helpUrl": ""
    }, 
    "run": async (context) => {
        context.blockIn();
        
        var text = (await context.getValue("TEXT")).toString();
        var regexText = context.getField("REGEX");
        let regex;
        try {
            regex = new RegExp(regexText);
        } catch(e) {
            log.e(`Regular expression error: '${regexText}' (${e.message})`);
            return null;
        }
        
        sdebug(`Executes ${text} against ${regexText}`);
        return regex.exec(text);
    }
}

function getInfo(env) {
    return {
        "id": "regex",
        "name": "Regex management library",
        "author": "Alfonso Vila"
    }
}

async function getBlocks() {
    return {
        "text_regex_test": regexTestBlock, 
        "text_regex_exec": regexExtractRegexBlock
    };
}

function getServices() {
    return {};
}

function getToolbox() {
    return {
        "default": {
            "Regex": ' \
            <block type="regex.text_regex_test"></block> \
            <block type="regex.text_regex_exec"></block> \
            '
        }
    }
}

module.exports = {
    getInfo: getInfo,
    getBlocks: getBlocks,
    getServices: getServices,
    getToolbox: getToolbox
}
