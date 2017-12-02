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

var CarMessageGateway = require('./car-message-gateway');
var async = require('async');

class Car {
    constructor(no, startLane, receivedMessages) {
        this.carNo = no;
        this.startLane = startLane;
        this.receivedMessages = receivedMessages;
        this.carMessageGateway = new CarMessageGateway();
    }

    updateLocation(lane, piece, position) {
        this.lane = lane;
        this.piece = piece;
        this.position = position;
    }

    setPeripheral(peripheral) {
        var that = this;
        this.peripheral = peripheral;

        // Handle disconnect
        peripheral.on('disconnect', function () {
            console.log('INFO: Car has been disconnected');
            process.exit(0);
        });

        // Handle connect
        peripheral.connect(function (error) {
            console.log('INFO: Car has been connected');
            if (error != null) {
                console.log('ERROR: Error connection car', error);
                process.exit(1);
            }
            // Handle services (there is only one service)
            peripheral.discoverServices([], function (error, services) {
                console.log('INFO: Discovered services');
                if (error != null) {
                    console.log('ERROR: Error connection car', error);
                    process.exit(1);
                }

                var service = services[0];

                // Handle characteristics (iterate of all characteristics provided)
                service.discoverCharacteristics([], function (error, characteristics) {
                    var characteristicIndex = 0;

                    async.whilst(
                        // Whilst condition
                        function () {
                            return (characteristicIndex < characteristics.length);
                        },
                        // Whilst body
                        function (callback) {
                            console.log('INFO: Next characteristic');
                            var characteristic = characteristics[characteristicIndex];
                            async.series([
                                // Step 1: Handle characteristic
                                function (callback) {
                                    if (characteristic.uuid == 'be15bee06186407e83810bd89c4d8df4') {
                                        console.log('INFO: Read characteristic');
                                        that.carMessageGateway.setReadCharacteristics(characteristic, function(data) {
                                            that.receivedMessages.handle(data, that.carNo);
                                        });
                                    }
                                    // Write characteristic => ignore
                                    if (characteristic.uuid == 'be15bee16186407e83810bd89c4d8df4') {
                                        console.log('INFO: Write characteristic', carMessageGateway);
                                        that.carMessageGateway.setWriteCharacteristics(characteristic);
                                        initCar();
                                        characteristic.on('read', function (data, isNotification) {
                                            console.log('Data received which will be ignored - writeCharacteristic', data);
                                        });
                                    }
                                    callback();
                                },
                                // Step 2: Increase counter / index
                                function () {
                                    characteristicIndex++;
                                    callback();
                                }
                            ]);
                        },
                        // Whilst error handler
                        function (error) {
                            console.log('Error processing characteristics from peripheral service');
                        }
                    );
                });
            });
        });
    }

    initCar() {
        ////////////////////////////////////////////////////////////////////////////////
        // Initialise system
        console.log("INFO: Initialise lane");
        // turn on sdk and set offset
        this.carMessageGateway.sendInitCommand(this.startLane);
    }

    disconnect() {
        this.peripheral.disconnect();
    }
}
module.exports = Car;