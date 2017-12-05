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

var MessageNames = require("./message-names");
var PositionUpdateMessage = require('./messages/position-update-message');
var PingMessage = require('./messages/ping-message');
var VersionMessage = require('./messages/car-message');
var BatteryMessage = require('./messages/battery-message');
var TransitionUpdateMessage = require('./messages/transition-update-message');
var DelocalizedMessage = require('./messages/vehicle-delocalized-message');
var OffsetCenterMessage = require('./messages/offset-center-message');
var OffsetChangedMessage = require('./messages/offset-changed-message');

class BluetoothMessageExtractor {

	constructor() {
	}

	generateMessage(data) {
        var messageId = data.readUInt8(1);
        console.log('INFO: Reading Id:', messageId);
        var messageTimestamp = new Date();

        if (messageId == '23') {
            // example: <Buffer 01 17>

            return new PingMessage(messageId, MessageNames.PING, messageTimestamp);
        }
        else if (messageId == '25') {
            // example: <Buffer 05 19 6e 26 00 00>
            var carVersion = data.readUInt16LE(2);
            return new VersionMessage(messageId, MessageNames.VERSION, messageTimestamp, carVersion);
        }
        else if (messageId == '27') {
            // example: <Buffer 03 1b 50 0f>
            var catBatteryLevel = data.readUInt16LE(2);
            return new BatteryMessage(messageId, MessageNames.BATTERY_LEVEL, messageTimestamp, catBatteryLevel);
        }

        else if (messageId == '39') {
            // example: <Buffer 10 27 21 28 48 e1 86 c2 02 01 47 00 00 00 02 fa 00>
            var posLocation = data.readUInt8(2);
            var posTileNo = data.readUInt8(3); // in my starter kit:
            // 1 x straight: 36
            // 1 x straight: 39
            // 1 x straight: 40
            // 1 x curve: 20
            // 1 x curve: 23
            // 2 x curve: 18
            // 2 x curve: 17
            // 1 x start/finish: 34 (long) and 33 (short)
            var laneOffset = data.readFloatLE(4);
            var carSpeed = data.readUInt16LE(8);
            return new PositionUpdateMessage(messageId, MessageNames.POSITION_UPDATE, messageTimestamp,
                posLocation, posTileNo, laneOffset, carSpeed);
        }

        else if (messageId == '41') {
            // example: <Buffer 12 29 00 00 02 2b 55 c2 00 ff 81 46 00 00 00 00 00 25 32>
            var laneOffset = data.readFloatLE(4);
            return new TransitionUpdateMessage(messageId, MessageNames.TRANSITION_UPDATE, messageTimestamp, laneOffset);
        }

        else if (messageId == '43') {
            // example: <Buffer 01 2b>
            return new DelocalizedMessage(messageId, MessageNames.VEHICLE_DELOCALIZED, messageTimestamp);
            console.log('Message: ' + messageId, data, desc);
        }

        else if (messageId == '45') {
            // example: <Buffer 06 2d 00 c8 75 3d 03>
            var laneOffset = data.readFloatLE(2);
            return new OffsetCenterMessage(messageId, MessageNames.OFFSET_CENTER, messageTimestamp, laneOffset);
        }

        else if (messageId == '54') {
            // example: <Buffer 03 36 00 00>
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else if (messageId == '63') {
            // example: <Buffer 05 3f 01 00 00 01>
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else if (messageId == '65') {
            // example: <Buffer 0e 41 9a 99 7f 42 9a 99 7f 42 00 00 00 02 81>
            var laneOffset = data.readFloatLE(2);
            return new OffsetChangedMessage(messageId, MessageNames.OFFSET_CHANGED, messageTimestamp, laneOffset);
        }

        else if (messageId == '67') {
            // example: <Buffer 01 43>
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else if (messageId == '77') {
            // example: <Buffer 03 4d 00 01>
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else if (messageId == '134') {
            // example: <Buffer 0b 86 8e 00 27 08 00 00 10 10 00 00>
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else if (messageId == '201') {
            // example: tbd
            //console.log('Message: ' + messageId, data, 'Not documented');
        }

        else {
            //console.log('Message: ' + messageId, data, 'Unknown');
        }
	}
}

module.exports = BluetoothMessageExtractor;