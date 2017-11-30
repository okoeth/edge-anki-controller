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

    setReadCharacteristics(readCharacteristic) {
        this.readCarachteristic = readCharacteristic;
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
}

module.exports = CarMessageGateway;
