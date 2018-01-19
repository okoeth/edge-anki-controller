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

var config = require('./config-wrapper.js')();
var noble_factory = require('./noble/noble-factory');
var noble = undefined;
var CarMessageGateway = require('./anki/car-message-gateway');
var carMessageGateway = new CarMessageGateway();
var readline = require('readline');
var prepareMessages = require('./prepareMessages.js')();
var kafka_factory = require('./kafka/kafka-factory');
var kafka = undefined;
var Car = require('./anki/car');
var TrackScanner = require('./anki/track-scanner');
var TrackConfigurationLoader = require('./anki/track-configuration-loader');
var configurationLoader;

// add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');

const commandLineArgs = require('command-line-args')
const optionDefinitions = [
    { name: 'config', alias: 'c', type: String, defaultValue: "config-car1.properties" },
    { name: 'kafka', alias: 'k', type: String },
    { name: 'noble', alias: 'n', type: String },
	{ name: 'trackConfig', alias: 't', type: String}
]
// Read the actual options
const options = commandLineArgs(optionDefinitions)

var car;
var lane;
var that = this;
var configCarNo;
var configStartLane;
var trackConfigPath;

// Read properties and start receiving BLE messages
config.read(options['config'], function (carNo, carId, startlane) {
	try {
        configCarNo = carNo;
        configStartLane = startlane;

        // Read properties
        if (!carNo && isNaN(carNo * 1) && carNo > 0 && carNo < 5) {
            console.log('ERROR: Define carno as integer (1-4) in a properties file and pass in the name of the file as argv');
            process.exit(1);
        }
        if (!carId) {
            console.log('ERROR: Define carid in a properties file and pass in the name of the file as argv');
            process.exit(1);
        }
        //setup kafka
        if (options['kafka'] !== undefined) {
            kafka = kafka_factory.create(options['kafka'], carNo, carMessageGateway);
        } else {
            kafka = kafka_factory.create("multi", carNo, carMessageGateway);
        }

        kafka.on('message', function (message) {
            if (car !== undefined && message !== undefined) {
                if(message.indexOf('swap') > -1) {
                    swapCar(message);
                }

                car.sendCommand(message);
            } else if (message !== undefined) {
                if(message.indexOf('swap') > -1) {
                    swapCar(message);
                }
            } else {
                console.log('WARNING: Ignoring command... car not ready: ', message);
            }
        });

        if(!options["trackConfig"]) {
            trackConfigPath = process.env.TRACK_CONFIG;
        } else {
            trackConfigPath = options["trackConfig"];
        }

        configurationLoader = new TrackConfigurationLoader(trackConfigPath).getTrackConfig(function (trackConfiguration) {
            //setup noble
            if (options['noble']) {
                noble = noble_factory.create(options['noble'], carId, trackConfiguration);
            } else {
                noble = noble_factory.create("noble", carId, trackConfiguration);
            }
            lane = startlane;

            noble.on('stateChange', function (state) {
                if (state === 'poweredOn') {
                    var notDiscoveredTimeout = setTimeout(function () {
                        console.log("WARNING: Could not discover car");
                        process.exit();
                    }, 10000);

                    console.log('INFO: Start scanning for cars (ended after 2sec with timer)');
                    noble.startScanning();
                    setTimeout(function () {
                        noble.stopScanning();
                    }, 2000);

                    noble.on('discover', function (peripheral) {
                        console.log('INFO: Peripheral discovered with ID: ' + peripheral.id);
                        if (peripheral.id === carId) {
                            clearTimeout(notDiscoveredTimeout);
                            noble.stopScanning();

                            var advertisement = peripheral.advertisement;
                            var serviceUuids = JSON.stringify(peripheral.advertisement.serviceUuids);
                            if (serviceUuids.indexOf("be15beef6186407e83810bd89c4d8df4") > -1) {
                                console.log('INFO: Car discovered. ID: ' + peripheral.id);
                                car = new Car(carNo, startlane, trackConfiguration);
                                car.setPeripheral(peripheral);

                                // When car gets new message
                                car.on('messageReceived', function (message) {
                                    //kafka.sendMessage(JSON.stringify(message));
                                    kafka.sendMessage(message);
                                });
                            }
                        }
                    });
                } else {
                    console.error("Noble sent state change: " + state);
                    noble.stopScanning();
                }
            });

            noble.on('warning', function(warning) {
                console.error("Noble sent warning: " + warning);
            });
        });
    } catch(error) {
		console.error(error);
	}
});

////////////////////////////////////////////////////////////////////////////////
// Manual input processing
var cli = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

cli.on('line', function (cmd) {
	try {
		if (cmd == 'help') {
			console.log(prepareMessages.doc());
		}
		else if (cmd == 'sim') {
			simulated = '{ "status_id" : "25", "status_name" : "Version", "version" : 42 }'
			console.log("Simulate: " + simulated);
			kafka.sendMessage(simulated,
				function (err, data) {
					console.log(data);
				});
		}
		else if(cmd.indexOf('scan') > -1) {
			console.log("INFO: Scan command from CLI");
			var commandArray;
			commandArray = cmd.split(' ');
			var countTiles = 0;
			var trackType = "NORMAL";
			if (commandArray.length > 0) {
				countTiles = parseInt(commandArray[1]);
			}
			if (commandArray.length > 1) {
                trackType = commandArray[2];
            }

			if(countTiles > 0) {
				var trackScanner = new TrackScanner(car, options['trackConfig']);
				trackScanner.scanTrack(countTiles, trackType);
			}
		}
		else if(cmd.indexOf("swap") > -1) {
            console.log("INFO: swap command from CLI");
            var commandArray;
            commandArray = cmd.split(' ');
            var newBluetoothId = '';
            if (commandArray.length > 0) {
                newBluetoothId = commandArray[1];
            }

            var startLane = configStartLane;
            if(car !== undefined)
                startLane = car.laneNo;

            config.write(configCarNo, newBluetoothId, startLane, options['config']);
        }
		else {
			console.log("INFO: Send command from CLI");
			car.sendCommand(cmd);
		}
	} catch(error) {
		console.error(error);
	}
});

process.stdin.resume();

////////////////////////////////////////////////////////////////////////////////
// Graceful exist
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

function exitHandler(options, err) {
	if (car) {
        car.disconnect();
        delete car
    }

	if (kafka) {
	    kafka.disconnect();
        delete kafka;
    }

    if(err != undefined && err !== 0) {
		console.error(err);
	}

	process.exit()
}

function swapCar(command) {
    console.log("INFO: swap command");
    var commandArray;
    commandArray =  command.split(' ');
    var newBluetoothId = '';
    if (commandArray.length > 0) {
        newBluetoothId = commandArray[1];

        var startLane = configStartLane;
        if(car !== undefined) {
            startLane = car.laneNo;
        }

        if (startLane == undefined) {
            startLane = 1;
        }

        config.write(configCarNo, newBluetoothId, startLane, options['config']);

    } else {
        console.log("INFO: No valid swap command");
    }


}