module.exports = {
    taskerScheduledEvent: {
        "type": "tasker_scheduled_event",
        "message0": "Execute %1 %2",
        "args0": [
            {
                "type": "input_value",
                "name": "CRON",
                "check": "Cron"
            },
            {
                "type": "input_statement",
                "name": "CMD"
            }
        ],
        "colour": 60,
        "tooltip": "Executes a command block on the defined date/time",
        "helpUrl": ""
    }, 
    
    
    
    cronEveryday: {
        "type": "cron_everyday",
        "message0": "everyday %1",
        "args0": [
            {
                "type": "input_value",
                "name": "CRONTIME",
                "check": "CronTime"
            }
        ],
        "output": "Cron",
        "colour": 70,
        "tooltip": "Every day matches",
        "helpUrl": ""
    }, 
    cronDom: {
        "type": "cron_dom",
        "message0": "on day of month %1 at %2",
        "args0": [
            {
                "type": "field_input",
                "name": "DOM",
                "text": "1,4-8"
            },
            {
                "type": "input_value",
                "name": "CRONTIME",
                "check": "CronTime"
            }
        ],
        "output": "Cron",
        "colour": 70,
        "tooltip": "Defined day of month",
        "helpUrl": ""
    }, 
    cronDow: {
        "type": "cron_dow",
        "message0": "on day of week %1 Mon %2 Tue %3 Wed %4 Thu %5 Fri %6 Sat %7 Sun at %8",
        "args0": [
            {
                "type": "field_checkbox",
                "name": "MON",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "TUE",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "WED",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "THU",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "FRI",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "SAT",
                "checked": true
            },
            {
                "type": "field_checkbox",
                "name": "SUN",
                "checked": true
            },
            {
                "type": "input_value",
                "name": "CRONTIME",
                "check": "CronTime"
            }
        ],
        "output": "Cron",
        "colour": 70,
        "tooltip": "Defined days of week",
        "helpUrl": ""
    }, 
    cronEveryTime: {
        "type": "cron_every_time",
        "message0": "at every %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "INTERVAL",
                "options": [
                    [
                        "second",
                        "SECOND"
                    ],
                    [
                        "minute",
                        "MINUTE"
                    ],
                    [
                        "hour",
                        "HOUR"
                    ]
                ]
            }
        ],
        "output": "CronTime",
        "colour": 80,
        "tooltip": "Every second, minute at 0 seconds and hour at 0 minutes matches",
        "helpUrl": ""
    }, 
    cronHours: {
        "type": "cron_hours",
        "lastDummyAlign0": "RIGHT",
        "message0": "on hour %1 %2 minute %3 %4 second %5",
        "args0": [
            {
                "type": "field_input",
                "name": "HOUR",
                "text": "1,13-14"
            },
            {
                "type": "input_dummy"
            },
            {
                "type": "field_input",
                "name": "MINUTE",
                "text": "*/11"
            },
            {
                "type": "input_dummy",
                "align": "RIGHT"
            },
            {
                "type": "field_input",
                "name": "SECOND",
                "text": "0,52"
            }
        ],
        "output": "CronTime",
        "colour": 80,
        "tooltip": "Hour fine definition",
        "helpUrl": ""
    }, 
    programJob: {
        "type": "program_job",
        "message0": "Execute after %1 %2 %3 %4",
        "args0": [
          {
            "type": "field_number",
            "name": "INTERVAL",
            "value": 0,
            "min": 1
          },
          {
            "type": "field_dropdown",
            "name": "TYPE",
            "options": [
              [
                "ms",
                "MS"
              ],
              [
                "secs",
                "SECS"
              ],
              [
                "mins",
                "MINUTES"
              ],
              [
                "hours",
                "HOURS"
              ]
            ]
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "CMD"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 60,
        "tooltip": "Executes a command block after the specified interval",
        "helpUrl": ""
      }
}