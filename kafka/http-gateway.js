// Copyright 2018 NTT Group

// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be included in all copies
// or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
// FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

const EventEmitter = require('events');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const io = require('socket.io-client');
const WebSocket = require('ws');


class HttpGateway extends EventEmitter {

    constructor(carNo) {
        super();
        var that = this;

        var url = 'http://localhost/status';
        that.socket = new WebSocket('ws://localhost:8003/status');

        that.socket.on('open', function open() {
            console.log("INFO: Connected to websocket on " + url);
        });


        //setup a http listener on port 900<car-no> for cmds
        app.use(bodyParser.text())


        var port = "809" + carNo;
        app.post('/cmd', function (req, res) {
            console.log("INFO: Received post request at " + new Date() + ":" + req.body);
            that.emit('message', req.body);
            res.send('Received command');
        });

        app.listen(port, function () {
            console.log('INFO: Http listening on port ' + port);
        });
    }

    sendMessage(message) {
        console.log("INFO: Http SendMessage invoked: ", message);
        try {
            /*var request = new http.ClientRequest({
                hostname: "localhost",
                port: 8089,
                path: "/status",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(message)
                }
            });

            request.on('error', function(e) {
                console.log('ERROR: Could not send message to adas ' + e.message);
            });

            request.end(message);*/

            if(this.socket.readyState == 1)
                this.socket.send(message);
            else
                console.error('ERROR: A problem occurred when sending our message to adas');
        } catch (err) {
            console.error('ERROR: A problem occurred when sending our message to adas');
            console.error(err);
        }
    }

    disconnect() {
    }

}

module.exports = HttpGateway;