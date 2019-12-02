'use strict';

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

            log.i("Function " + fnName);

            await context.continue("PARAMS", false);
            await context.continue("RETURN", false);

            return context.customFunctions;
        } else {
            let msg = context.params;
            let vars = Object.keys(context.params);
            for(let n = 0; n < vars.length; n++) {
                log.i("Set var: " + vars[n]);
                context.setVar(vars[n], msg[vars[n]]);
            }

            await context.continue("BODY");

            return context.vars;
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

        log.i("Param " + paramName);
    }
}

const returnBlock = {
    block: blocks.fn_return,
    run: async function(context) {
        context.blockIn();

        let returnName = context.getField("NAME");

        log.d("Function return " + returnName);
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
