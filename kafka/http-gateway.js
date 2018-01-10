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
const PositionUpdateMessage = require('../anki/messages/position-update-message');

var httpWebsocket = process.env.HTTP_WEBSOCKET;

class HttpGateway extends EventEmitter {

    constructor(carNo) {
        super();
        var that = this;

        if (httpWebsocket==null || httpWebsocket==''){
            console.log('Using localhost as default http websocket server.');
            httpWebsocket='localhost:8003'
        } else {
            console.log('Using ' + httpWebsocket + 'as http websocket server.');
        }

        this.connectToSocket();
        setInterval(this.checkConnection.bind(this), 5000)

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

    connectToSocket() {
        try {
            var that = this;
            console.log("INFO: Trying to connect to websocket");

            that.socket = new WebSocket('ws://' + httpWebsocket + '/status');

            that.socket.on('open', function open() {
                console.log("INFO: Connected to websocket");

                if (that.connectInterval !== undefined) {
                    clearInterval(that.connectInterval);
                    that.connectInterval = undefined;
                }
            });

            that.socket.on('error', function(error) {
                if (error != null) {
                    console.log('%s', error);
                    that.socket.close();
                    that.socket = null;
                }
            });

            that.socket.on('disconnect', function(error) {
                console.log("INFO: Disconnected from socket");
            });
        } catch(error) {
            console.error(error);
        }
    }

    checkConnection() {
        try {
            if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
                if (this.connectInterval === undefined) {
                    this.connectInterval = setInterval(this.connectToSocket.bind(this), 5000)
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    sendMessage(message) {
        if(message instanceof PositionUpdateMessage) {
            var csvMessage = message.toCSV();
            console.log("INFO: Http SendMessage invoked: ", csvMessage);

            if(this.socket !== null && this.socket.readyState == WebSocket.OPEN) {
                this.socket.send(csvMessage);
            }
            else {
                console.error('ERROR: A problem occurred when sending our message to adas');
            }
        }

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


        } catch (err) {
            console.error('ERROR: A problem occurred when sending our message to adas');
            console.error(err);
        }
    }

    disconnect() {
        if(this.socket !== null)
            this.socket.close();
        this.socket = null

    }

}

module.exports = HttpGateway;