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
var async = require('async');
var noble_factory = require('./noble/noble-factory');
var noble = undefined;
//var noble = require('noble');
var readline = require('readline');
var receivedMessages = require('./receivedMessages.js')();
var prepareMessages = require('./prepareMessages.js')();
var kafka_factory = require('./kafka/kafka-factory');
var kafka = undefined;

var readCharacteristic;
var writeCharacteristic;
var car;
var lane;

// Read properties and start receiving BLE messages
config.read(process.argv[2], function(carNo, carId, startlane) {
	// Read properties
	if (!carNo && isNaN(carNo*1) && carNo > 0 && carNo < 5) {
		console.log('ERROR: Define carno as integer (1-4) in a properties file and pass in the name of the file as argv');
		process.exit(1);
	}
	if (!carId) {
		console.log('ERROR: Define carid in a properties file and pass in the name of the file as argv');
		process.exit(1);
	}
  //setup kafka
  if(process.argv.length >= 4) {
      kafka = kafka_factory.create(process.argv[3], carNo);
  }

  //setup noble
  if(process.argv.length >= 5) {
      noble = noble_factory.create(process.argv[4], carId);
  }

  lane = startlane;

		  
	console.log('INFO: Start scanning for cars (ended after 2sec with timer)');
	noble.startScanning();
	setTimeout(function() {
		noble.stopScanning();
	}, 2000);

	noble.on('discover', function(peripheral) {
		console.log('INFO: Peripheral discovered with ID: ' + peripheral.id); 
		if (peripheral.id === carId) {
			noble.stopScanning();

			var advertisement = peripheral.advertisement;
			var serviceUuids = JSON.stringify(peripheral.advertisement.serviceUuids);
			if(serviceUuids.indexOf("be15beef6186407e83810bd89c4d8df4") > -1) {
				console.log('INFO: Car discovered. ID: ' + peripheral.id); 
				car = peripheral;
				setUp(car);
			}
		}
	});

	// Handle connection to car
	function setUp(peripheral) {
		// Handle disconnect
		peripheral.on('disconnect', function() {
			console.log('Car has been disconnected');
			process.exit(0);
		});

		// Handle connect
		peripheral.connect(function(error) {
			// Handle services (there is only one service)
			peripheral.discoverServices([], function(error, services) {
				var service = services[0];

				// Handle characteristics (iterate of all characteristics provided)
				service.discoverCharacteristics([], function(error, characteristics) {
					var characteristicIndex = 0;

				  	async.whilst(
						// Whilst condition
						function () {
					  		return (characteristicIndex < characteristics.length);
						},
						// Whilst body
						function(callback) {
						  var characteristic = characteristics[characteristicIndex];
						  async.series([
							// Step 1: Handle characteristic
							function(callback) {
							  // Read characteristic => the beef
							  if (characteristic.uuid == 'be15bee06186407e83810bd89c4d8df4') {
								readCharacteristic = characteristic;
								readCharacteristic.notify(true, function(err) {});
								characteristic.on('read', function(data, isNotification) {
								  console.log('INFO: Data received which will be handled: ', data)
								  receivedMessages.handle(data, carNo, kafka);
								});
							  }
							  // Write characteristic => ignore
							  if (characteristic.uuid == 'be15bee16186407e83810bd89c4d8df4') {
								writeCharacteristic = characteristic;
								init(startlane);
								characteristic.on('read', function(data, isNotification) {
								  console.log('Data received which will be ignored - writeCharacteristic', data);
								});
							  }
							  callback();
							},
							// Step 2: Increase counter / index
							function() {
								characteristicIndex++;
								callback();
							}
						  ]);
						},
						// Whilst error handler
						function(error) {
							console.log('Error processing characteristics from peripheral service');
						}
					);
				});
			});
		});
	}
});

////////////////////////////////////////////////////////////////////////////////
// Initialise system
function init(startlane) {
	// turn on sdk and set offset
	var initMessage = new Buffer(4);
	initMessage.writeUInt8(0x03, 0);
	initMessage.writeUInt8(0x90, 1);
	initMessage.writeUInt8(0x01, 2);
	initMessage.writeUInt8(0x01, 3);
	writeCharacteristic.write(initMessage, false, function(err) {
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
			writeCharacteristic.write(initMessage, false, function(err) {
				if (!err) {
					console.log('Initialization was successful');
					console.log('Enter a command: help, s (speed), c (change lane), e (end/stop), l (lights), lp (lights pattern), o (offset), sdk, ping, bat, ver, q (quit)');
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

////////////////////////////////////////////////////////////////////////////////
// Send command to car
function invokeCommand(cmd) {
	console.log('INFO: Invoke command: '+cmd)
	
	var message = prepareMessages.format(cmd);
	if (message) {                     
		console.log("INFO: Command: " + cmd, message);
						 
		if (writeCharacteristic) { 
			writeCharacteristic.write(message, false, function(err) {
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

////////////////////////////////////////////////////////////////////////////////
// Manual input processing
var cli = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

cli.on('line', function (cmd) {
	if (cmd == 'help') {
		console.log(prepareMessages.doc());
	} 
	else if (cmd == 'sim') {
		simulated = '{ "status_id" : "25", "status_name" : "Version", "version" : 42 }'
		console.log("Simulate: "+simulated);
		kafka.sendMessage([{ topic: 'Status', messages: simulated, partition: 0 }],
			function (err, data) {
				console.log(data);
			});
	} 
	else {
		invokeCommand(cmd);
	}                        
});

process.stdin.resume();

////////////////////////////////////////////////////////////////////////////////
// Graceful exist
process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

function exitHandler(options, err) {
	if (car) car.disconnect();
}
