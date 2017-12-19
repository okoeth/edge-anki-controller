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
const EventEmitter = require('events');
const BluetoothMessageExtractor = require('./bluetooth-message-extractor');
const PositionUpdateMessage = require('./messages/position-update-message');
const VehicleDelocalizedMessage = require('./messages/vehicle-delocalized-message');
const TransitionUpdateMessage = require('./messages/transition-update-message');
const PositionCalculator = require("./tile-position-calculator");
const PosOption = require("./pos-option");

class Car extends EventEmitter {
    constructor(no, startLane, trackConfiguration) {
        super();

        this.carNo = no;
        this.startLane = startLane;
        this.bluetoothMessageExtractor = new BluetoothMessageExtractor();
        this.carMessageGateway = new CarMessageGateway();
        this.positionCalculator = new PositionCalculator(trackConfiguration);
        this.currentTileIndex = -1;

        this.validConfiguration = !trackConfiguration.outdated;
    }

    updateLocation(positionUpdateMessage) {
        this.laneNo = positionUpdateMessage.laneNo;
        this.realTileId = positionUpdateMessage.posTileNo;
        this.tileId = positionUpdateMessage.posOptions;
        this.position = positionUpdateMessage.posLocation;
        this.lastUpdateTime = positionUpdateMessage.msgTimestamp;
        this.carSpeed = positionUpdateMessage.carSpeed;
    }

    updateTileNo(tileId, position) {
        this.tileId = tileId;
        this.position = position;
    }

    resetLocation() {
        this.laneNo = undefined;
        this.realTileId = undefined;
        this.tileId = undefined;
        this.position = undefined;
        this.lastUpdateTime = undefined;
        this.currentTileIndex = -1;
        this.carSpeed = 0;
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

                                            var message = that.bluetoothMessageExtractor.generateMessage(data);
                                            
                                            if (message !== undefined) {
                                                if(that.validConfiguration) {
                                                    console.log("INFO: Received message: " + JSON.stringify(message));

                                                    if (message instanceof TransitionUpdateMessage) {
                                                        if (that.currentTileIndex > -1) {
                                                            //Interpolate
                                                             that.currentTileIndex = that.positionCalculator.getNextTileIndex(that.currentTileIndex);
                                                            var currentTile = that.positionCalculator.getTileByIndex(that.currentTileIndex);

                                                            if (that.laneNo !== undefined) {
                                                                message.posLocation = that.positionCalculator.getFirstTilePosition(currentTile, that.laneNo);
                                                                message.posTileNo = currentTile.realId;
                                                                message.posTileType = currentTile.type;
                                                                message.posOptions = [new PosOption(currentTile.id, 75)];
                                                                message.laneNo = that.laneNo;
                                                                message.carSpeed = that.carSpeed;
                                                                message.laneLength = that.positionCalculator.getLaneLength(currentTile, that.laneNo);
                                                                message.maxTileNo = that.positionCalculator.getMaxTileNo();
                                                                that.updateLocation(message);
                                                            }
                                                        }
                                                    }
                                                    else if (message instanceof PositionUpdateMessage) {

                                                        /***
                                                         * TODO: If last update was a while ago (time difference),
                                                         * don't use for calculation of internal piece id
                                                         */
                                                        console.log('INFO: TileID:', that.tileId);
                                                        message.posOptions =
                                                            that.positionCalculator.getCarPosition(message.posTileNo, that.currentTileIndex);

                                                        message.laneNo = that.positionCalculator.getLaneNo(message.posOptions, message.posLocation);
                                                        message.maxTileNo = that.positionCalculator.getMaxTileNo();

                                                        //If laneNo not found, take the old one
                                                        if (!message.laneNo && !that.laneNo) {
                                                            message.laneNo = that.laneNo;
                                                        }

                                                        if (message.posOptions.length == 1) {
                                                            that.currentTileIndex = that.positionCalculator.getIndexFromTileId(message.posOptions[0].optTileNo);
                                                            that.currentTile = that.positionCalculator.getTileByIndex(message.posOptions[0].optTileNo);

                                                            message.posTileType = that.currentTile.type;
                                                            if (message.laneNo !== undefined)
                                                                message.laneLength = that.positionCalculator.getLaneLength(that.currentTile, message.laneNo);
                                                        }

                                                        message.posLocation = parseInt(message.posLocation);
                                                        that.updateLocation(message);
                                                    }
                                                    else if (message instanceof VehicleDelocalizedMessage) {
                                                        that.resetLocation();
                                                    }

                                                    that.emit('messageReceived', that.addFieldsToMessage(message));
                                                } else {
                                                    that.emit('messageReceived', message);
                                                }
                                            }
                                        });
                                    }
                                    // Write characteristic => ignore
                                    else if (characteristic.uuid == 'be15bee16186407e83810bd89c4d8df4') {
                                        console.log('INFO: Write characteristic');
                                        that.carMessageGateway.setWriteCharacteristics(characteristic);
                                        that.initCar();
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
        console.log("INFO: Initialise laneNo");
        // turn on sdk and set laneOffset
        this.carMessageGateway.sendInitCommand(this.startLane);
    }

    sendCommand(cmd) {
        this.carMessageGateway.sendCommand(cmd);
    }

    addFieldsToMessage(message) {
        message["carNo"] = this.carNo;
        message["carID"] = this.peripheral.id;
        return message;
    }

    addPositionToMessage(message) {

    }

    disconnect() {
        this.peripheral.disconnect();
    }
}
module.exports = Car;