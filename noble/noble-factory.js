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

var carMock;
var noble = require('noble');

module.exports.create = function(type, carId, trackConfig) {
    if(type === "mock") {
        console.log('INFO: Using noble mock');
        //Set up all mock dependencies. The general data producer is the car mock
        var NobleMock = require('./noble-mock');
        var ReadCharacteristic = require('./read-characteristics-mock');
        var CarMock = require('./car-mock');
        var readCharacteristicMock = new  ReadCharacteristic();
        carMock = new CarMock(readCharacteristicMock, trackConfig);
        return new NobleMock(carId, readCharacteristicMock);
    }
    else {
        console.log('INFO: Using noble');
        return noble; //require('./noble');
    }
};