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

var httpAdasWebsocket = process.env.HTTP_ADAS_WEBSOCKET;
var httpTwinWebsocket = process.env.HTTP_TWIN_WEBSOCKET;
var httpReceiverPort = process.env.HTTP_RECEIVER_PORT;
var httpBeatsWebsocket = process.env.HTTP_BEATS_WEBSOCKET;

class HttpGateway extends EventEmitter {

    constructor(carNo) {
        super();
        var that = this;

        if (httpAdasWebsocket==null || httpAdasWebsocket==''){
            console.log('Using localhost as default http adas websocket server.');
            httpAdasWebsocket='localhost:8003'
        } else {
            console.log('Using ' + httpAdasWebsocket + 'as http adas websocket server.');
        }

        if (httpTwinWebsocket==null || httpTwinWebsocket==''){
            console.log('Using localhost as default http twin websocket server.');
            httpTwinWebsocket='localhost:8001'
        } else {
            console.log('Using ' + httpTwinWebsocket + 'as http twin websocket server.');
        }

        if (httpBeatsWebsocket==null || httpBeatsWebsocket==''){
            console.log('Using localhost as default http twin websocket server.');
            httpBeatsWebsocket='localhost'
        } else {
            console.log('Using ' + httpTwinWebsocket + 'as http twin websocket server.');
        }

        if (httpReceiverPort==null || httpReceiverPort==''){
            console.log('Using 809' + carNo +  ' as default http receiver port.');
            httpReceiverPort='809' + carNo;
        } else {
            console.log('Using ' + httpReceiverPort + ' as http receiver port.');
        }

        this.connectToSocket();
        setInterval(this.checkConnection.bind(this), 5000)

        //setup a http listener on port 900<car-no> for cmds
        app.use(bodyParser.text())


        app.post('/cmd', function (req, res) {
            console.log("INFO: Received post request at " + new Date() + ":" + req.body);
            that.emit('message', req.body);
            res.send('Received command');
        });

        app.listen(httpReceiverPort, function () {
            console.log('INFO: Http listening on port ' + httpReceiverPort);
        });
    }

    connectToSocket() {
        try {
            var that = this;

            if(!that.adasSocket || that.adasSocket.readyState !== WebSocket.OPEN) {
                console.log("INFO: Trying to connect to adas websocket");
                that.adasSocket = new WebSocket('ws://' + httpAdasWebsocket + '/status');

                that.adasSocket.on('open', function open() {
                    console.log("INFO: Connected to adas websocket");

                    if (that.connectInterval !== undefined) {
                        clearInterval(that.connectInterval);
                        that.connectInterval = undefined;
                    }
                });

                that.adasSocket.on('error', function (error) {
                    if (error != null) {
                        console.log('%s', error);
                        that.adasSocket.close();
                        that.adasSocket = null;
                    }
                });

                that.adasSocket.on('disconnect', function (error) {
                    console.log("INFO: Disconnected from adasSocket");
                });
            }


            if(!that.twinSocket|| that.twinSocket.readyState !== WebSocket.OPEN) {
                console.log("INFO: Trying to connect to twin websocket");
                that.twinSocket = new WebSocket('ws://' + httpTwinWebsocket + '/status');

                that.twinSocket.on('open', function open() {
                    console.log("INFO: Connected to twin websocket");

                    if (that.connectInterval !== undefined) {
                        clearInterval(that.connectInterval);
                        that.connectInterval = undefined;
                    }
                });

                that.twinSocket.on('error', function (error) {
                    if (error != null) {
                        console.log('%s', error);
                        that.twinSocket.close();
                        that.twinSocket = null;
                    }
                });

                that.twinSocket.on('disconnect', function (error) {
                    console.log("INFO: Disconnected from twinSocket");
                });
            }

            if(!that.beatsSocket || that.beatsSocket.readyState !== WebSocket.OPEN) {
                console.log("INFO: Trying to connect to beats websocket");
                that.beatsSocket = new WebSocket('ws://' + httpBeatsWebsocket + '/status');

                that.beatsSocket.on('open', function open() {
                    console.log("INFO: Connected to betas websocket");

                    if (that.connectInterval !== undefined) {
                        clearInterval(that.connectInterval);
                        that.connectInterval = undefined;
                    }
                });

                that.beatsSocket.on('error', function (error) {
                    if (error != null) {
                        console.log('%s', error);
                        that.beatsSocket.close();
                        that.beatsSocket = null;
                    }
                });

                that.beatsSocket.on('disconnect', function (error) {
                    console.log("INFO: Disconnected from beatsSocket");
                });
            }
        } catch(error) {
            console.error(error);
        }
    }

    checkConnection() {
        try {
            if (this.adasSocket === null || this.adasSocket.readyState !== WebSocket.OPEN) {
                if (this.connectInterval === undefined) {
                    this.connectInterval = setInterval(this.connectToSocket.bind(this), 5000)
                }
            } else if (this.twinSocket === null || this.twinSocket.readyState !== WebSocket.OPEN) {
                if (this.connectInterval === undefined) {
                    this.connectInterval = setInterval(this.connectToSocket.bind(this), 5000)
                }
            } else if (this.beatsSocket === null || this.beatsSocket.readyState !== WebSocket.OPEN) {
                if (this.connectInterval === undefined) {
                    this.connectInterval = setInterval(this.connectToSocket.bind(this), 5000)
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    sendMessage(message) {
        //Send only position update + transition update to adas
        if(message instanceof PositionUpdateMessage) {
            var csvMessage = message.toCSV();
            console.log("INFO: Http SendMessage invoked: ", csvMessage);

            if(this.adasSocket !== null && this.adasSocket.readyState == WebSocket.OPEN) {
                this.adasSocket.send(csvMessage);
            }
            else {
                console.error('ERROR: A problem occurred when sending our message to adas');
            }

        }

        //Send all messages to twin
        if(this.twinSocket !== null && this.twinSocket.readyState == WebSocket.OPEN) {
            this.twinSocket.send(JSON.stringify(message));
        }
        else {
            console.error('ERROR: A problem occurred when sending our message to twin');
        }

        //Send all messages to beats
        if(this.beatsSocket !== null && this.beatsSocket.readyState == WebSocket.OPEN) {
            this.beatsSocket.send(JSON.stringify(message));
        }
        else {
            console.error('ERROR: A problem occurred when sending our message to beats');
        }

    }

    disconnect() {
        if(this.adasSocket !== null)
            this.adasSocket.close();
        this.adasSocket = null

        if(this.twinSocket !== null)
            this.twinSocket.close();
        this.twinSocket = null;

        if(this.beatsSocket !== null)
            this.beatsSocket.close();
        this.beatsSocket = null;

    }

}

module.exports = HttpGateway;