'use strict';

const debug = require('debug')('blockbrain:script:control');
const blocks = require('./functions.blocks.lib.js');

const fnBlock = {
    block: blocks.fn,
    run: async function(context) {
        context.blockIn();

        let fnName = context.getField("FUNCTION");

        let msg = context.getVar('msg');

        if(msg['___Custom Function Definition'] === true) {
            let section = context.getField("SECTION");
            let color = context.getField("COLOR");
            let description = context.getField("DESCRIPTION");

            context.customFunctions = {
                name: fnName, 
                section: section, 
                color: color, 
                tooltip: description, 
                params: {}, 
                returns: []
            };

            debug("Function " + fnName);

            await context.continue("PARAMS", false);
            await context.continue("RETURN", false);

            return context.customFunctions;
        } else {
            if(context.params["___Custom Function Execution"] == "fn.USER_" + fnName) {
                delete context.params["___Custom Function Execution"];

                log.f("LANZA FUNCION (" + fnName + ")");
                log.f(Object.keys(context.params));
                let msg = context.params;
                let vars = Object.keys(context.params);
                debug("params: " + JSON.stringify(context.params));
                for(let n = 0; n < vars.length; n++) {
                    debug("Set var: " + vars[n]);
                    context.setVar(vars[n], msg[vars[n]]);
                }

                await context.continue("BODY");

                return context.vars;
            }
        }
    }
}

const paramBlock = {
    block: blocks.fn_param,
    run: async function(context) {
        context.blockIn();

        let paramName = context.getField("NAME");
        let isVar = context.getField("ISVAR");

        context.customFunctions.params[paramName] = {
            var: isVar == "TRUE"
        };

        debug("Param " + paramName);
    }
}

const returnBlock = {
    block: blocks.fn_return,
    run: async function(context) {
        context.blockIn();

        let returnName = context.getField("NAME");

        debug("Function return " + returnName);
        context.customFunctions.returns.push(returnName);
    }
}

async function getBlocks() {
    return {
        "fn_fn": fnBlock,
        "fn_param": paramBlock,
        "fn_return": returnBlock
    }
}

function getToolbox() {
    return {
        "user functions": {
            "Function": ' \
            <block type="fn_fn"></block> \
            <block type="fn_param"></block> \
            <block type="fn_return"></block>'
        }
    }
}

module.exports = {
    getBlocks: getBlocks,
    getToolbox: getToolbox
}
