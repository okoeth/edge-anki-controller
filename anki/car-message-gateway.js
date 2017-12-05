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

var prepareMessages = require('../prepareMessages.js')();

class CarMessageGateway {

    constructor() {
    }

    setWriteCharacteristics(writeCharacteristic) {
        this.writeCharacteristic = writeCharacteristic;
    }

    setReadCharacteristics(readCharacteristic, receivedMessageHandler) {
        this.readCharacteristic = readCharacteristic;
        this.readCharacteristic.notify(true, function (err) { });

        this.readCharacteristic.on('read', function (data, isNotification) {
            console.log('INFO: Data received which will be handled: ', data)

            if(receivedMessageHandler !== undefined && receivedMessageHandler !== null) {
                receivedMessageHandler(data);
            }
        });
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Send command to car
    sendCommand(command) {
        console.log('INFO: Invoke command: '+ command)
        //console.log('INFO: Preparer: ', prepareMessages)
        
        var message = prepareMessages.format(command);
        if (message) {
            console.log("INFO: Process command: " + command, message);

            if (this.writeCharacteristic) {
                this.writeCharacteristic.write(message, false, function(err) {
                    if (!err) {
                        console.log('INFO: Command sent');
                    }
                    else {
                        console.log('ERROR: Error sending command');
                    }
                });
            } else {
                console.log('ERROR: Error sending command');
            }
        }
    }

    sendInitCommand(startlane) {
        var that = this;
        console.log('INFO: Send init command');
        var initMessage = new Buffer(4);
        initMessage.writeUInt8(0x03, 0);
        initMessage.writeUInt8(0x90, 1);
        initMessage.writeUInt8(0x01, 2);
        initMessage.writeUInt8(0x01, 3);
        this.writeCharacteristic.write(initMessage, false, function (err) {
            if (!err) {
                var initialOffset = 0.0;
                if (startlane) {
                    if (startlane == '1') initialOffset = 68.0;
                    if (startlane == '2') initialOffset = 23.0;
                    if (startlane == '3') initialOffset = -23.0;
                    if (startlane == '4') initialOffset = -68.0;
                }

                initMessage = new Buffer(6);
                initMessage.writeUInt8(0x05, 0);
                initMessage.writeUInt8(0x2c, 1);
                initMessage.writeFloatLE(initialOffset, 2);
                that.writeCharacteristic.write(initMessage, false, function (err) {
                    if (!err) {
                        console.log('Initialization was successful');
                        console.log('Enter a command: help, s (carSpeed), c (change laneNo), e (end/stop), l (lights), lp (lights pattern), o (laneOffset), sdk, ping, bat, ver, q (quit)');
                    }
                    else {
                        console.log('Initialization error');
                    }
                });
            }
            else {
                console.log('Initialization error');
            }
        });
    }
}

module.exports = CarMessageGateway;
