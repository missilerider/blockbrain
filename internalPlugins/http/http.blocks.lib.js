'use strict';

module.exports = {
    httpEndpoint: {
        "type": "http_endpoint",
        "message0": "http endpoint %1 %2 %3",
        "args0": [
            {
                "type": "field_input",
                "name": "PATH",
                "text": "/path/to/event"
            },
            {
                "type": "input_dummy"
            },
            {
                "type": "input_statement",
                "name": "CODE"
            }
        ],
        "colour": 210,
        "tooltip": "",
        "helpUrl": ""
    }, 
    
    httpEndpointGet: {
        "type": "http_endpoint_get",
        "message0": "http endpoint %1 %2 GET params %3 %4 %5",
        "args0": [
            {
                "type": "field_input",
                "name": "PATH",
                "text": "/path/to/event"
            },
            {
                "type": "input_dummy"
            },
            {
                "type": "field_variable",
                "name": "PARAMS",
                "variable": "params"
            },
            {
                "type": "input_dummy",
                "align": "RIGHT"
            },
            {
                "type": "input_statement",
                "name": "CODE"
            }
        ],
        "colour": 210,
        "tooltip": "",
        "helpUrl": ""
    }, 
    
    httpEndpointPost: {
        "type": "http_endpoint_post",
        "message0": "http endpoint %1 %2 POST json body %3 %4 %5",
        "args0": [
            {
                "type": "field_input",
                "name": "PATH",
                "text": "/path/to/event"
            },
            {
                "type": "input_dummy"
            },
            {
                "type": "field_variable",
                "name": "PARAMS",
                "variable": "params"
            },
            {
                "type": "input_dummy",
                "align": "RIGHT"
            },
            {
                "type": "input_statement",
                "name": "CODE"
            }
        ],
        "colour": 210,
        "tooltip": "",
        "helpUrl": ""
    }, 
    
    httpResponse: {
        "type": "http_response",
        "message0": "return HTTP %1 with body %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "CODE",
                "options": [
                    [
                        "200 OK",
                        "200"
                    ],
                    [
                        "202 Accepted",
                        "202"
                    ],
                    [
                        "301 Moved Permanently",
                        "301"
                    ],
                    [
                        "302 Found",
                        "302"
                    ],
                    [
                        "400 Bad Request",
                        "400"
                    ],
                    [
                        "401 Unauthorizeed",
                        "401"
                    ],
                    [
                        "403 Forbidden",
                        "403"
                    ],
                    [
                        "404 Not Found",
                        "404"
                    ],
                    [
                        "405 Method Not Allowed",
                        "405"
                    ],
                    [
                        "406 Not Acceptable",
                        "406"
                    ],
                    [
                        "500 Internal Server Error",
                        "500"
                    ]
                ]
            },
            {
                "type": "input_value",
                "name": "BODY"
            }
        ],
        "previousStatement": null,
        "colour": 210,
        "tooltip": "",
        "helpUrl": ""
    }
}