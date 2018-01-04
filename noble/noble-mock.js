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
const PeripheralMock = require('./periperhal-mock');

class NobleMock extends EventEmitter {
    constructor(carId, readCharacteristicsMock) {
        super();
        var that = this;
        this.periphal = new PeripheralMock(carId, readCharacteristicsMock);

        //Send powered on state change message
        setTimeout(function() {
            that.emit('stateChange', 'poweredOn');
        }, 1000);
    }

    startScanning() {
        console.log("INFO: Noble mock start scanning");
        this.interval = setInterval(this.mockDeviceDiscovered.bind(this), 1000)
    }

    stopScanning() {
        console.log("INFO: Noble mock stop scanning");
        clearInterval(this.interval);
    }

    mockDeviceDiscovered() {
        this.emit('discover', this.periphal);
    }
}

module.exports = NobleMock
