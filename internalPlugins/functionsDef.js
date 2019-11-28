'use strict';

const blocks = require('./functions.blocks.lib.js');


const fnBlock = {
    block: blocks.fn,
    run: async function(context) {
        context.blockIn();

        let fnName = context.getField("FUNCTION");

        log.i("Function " + fnName);
    }
}

const paramBlock = {
    block: blocks.fn_param,
    run: async function(context) {
        context.blockIn();

        let paramName = context.getField("NAME");

        log.i("Param " + paramName);
    }
}

const returnBlock = {
    block: blocks.fn_return,
    run: async function(context) {
        context.blockIn();

        let returnName = context.getField("NAME");

        log.i("Return " + fnNreturnNameame);
    }
}

function getBlocks() {
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
