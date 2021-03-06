const debug = require('debug')('blockbrain:script:tasker');

var jobs = {};
var lastJob = 0;

module.exports = {
    taskerScheduledEvent: async (context) => {
        context.blockIn();

        let msg = context.getVar('msg');

        if(msg['___Return Cron Expression'] === true) {
            // Requesting only cron expression
            let cron = await context.getValue("CRON");
            if(cron.includes('X')) {
                log.e(`Resulting cron expression contains errors and cannot be used: '${cron}'`);
                return null;
            }
            return cron;
        } else {
            debug(`Executes CRON!`);
            return await context.continue("CMD", true);
        }
    }, 
    cronEveryday: async (context) =>  {
        let time = await context.getValue("CRONTIME", "X X X");
        return time + " * * *";
    }, 
    cronDow: async (context) =>  {
        let mon = context.getField("MON", "FALSE") == "TRUE";
        let tue = context.getField("TUE", "FALSE") == "TRUE";
        let wed = context.getField("WED", "FALSE") == "TRUE";
        let thu = context.getField("THU", "FALSE") == "TRUE";
        let fri = context.getField("FRI", "FALSE") == "TRUE";
        let sat = context.getField("SAT", "FALSE") == "TRUE";
        let sun = context.getField("SUN", "FALSE") == "TRUE";

        let dow = [];
        if(mon) dow.push('1');
        if(tue) dow.push('2');
        if(wed) dow.push('3');
        if(thu) dow.push('4');
        if(fri) dow.push('5');
        if(sat) dow.push('6');
        if(sun) dow.push('0'); // Dumb ¬_¬ ...

        if(dow === []) return "X X X X X X";

        let time = await context.getValue("CRONTIME", "X X X");

        return time + " * * " + dow.join(",");
    },
    cronDom: async (context) =>  {
        console.log(new Date());
        let dom = context.getField('DOM', 'X') || 'X';
        if(dom.length < 1) dom = 'X';

        let time = await context.getValue("CRONTIME", "X X X");

        return time + " " + dom + " * *";
    },
    cronEveryTime: async (context) =>  {
        let time = context.getField("INTERVAL", "");

        switch(time) {
            case "SECOND": return "* * *";
            case "MINUTE": return "0 * *";
            case "HOUR": return "0 0 *";
            default: return "X X X";
        }
    },
    cronHours: async (context) =>  {
        let hour = context.getField("HOUR", "X") || "X";
        let min = context.getField("MINUTE", "X") || "X";
        let sec = context.getField("SECOND", "X") || "X";

        return `${sec} ${min} ${hour}`;
    }, 

    programJob: async(context) => {
        context.blockIn();

        let i = context.getField('INTERVAL');
        let intType = context.getField('TYPE');

        switch(intType) {
            case "HOURS": i *= 60;
            case "MINUTES": i *= 60;
            case "SECS": i *= 1000;
            case "MS": break;
        }

        let max = Math.pow(2, 31) - 1;

        if(i > max) {
            debug(`Interval too long (${i}). Waiting 'only' 2^31-1 milliseconds`);
            i = max;
        }

        var job = lastJob++;

        var fork = await context.fork("CMD", false);

        if(!fork) {
            return;
        }

        debug(`Program fork in ${i} milliseconds`);

        var handler = setTimeout(() => {
            delete jobs[job]; // Remove job

            debug(`Fork execution after ${i} milliseconds`);

            fork.run();
        }, i);

        jobs[job] = handler; // Keep track in case of service stop (or similar)
    }
}
