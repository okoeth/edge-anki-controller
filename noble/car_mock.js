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
const TrackConfiguration = require('../anki/track_configuration');

class CarMock {


    constructor(readCaracteristicsMock) {
        this.readCaracteristicsMock = readCaracteristicsMock;
        this.trackConfiguration = undefined;
        this.trackTileIndex = 0;

        new TrackConfiguration().getTrackConfig(this.setTrackConfiguration.bind(this));
    }

    setTrackConfiguration(trackConfiguration) {
        this.trackConfiguration = trackConfiguration;
        this.interval = setInterval(this.sendLocalizationPositionUpdate.bind(this), 5000)
    }

    sendPingMessage() {
        var pingMessage = new Buffer(4);
        pingMessage.writeUInt8(0x01, 0);
        pingMessage.writeUInt8(0x17, 1);
        pingMessage.writeUInt8(0x01, 2);
        pingMessage.writeUInt8(0x01, 3);
        this.readCaracteristicsMock.mockReadFromDevice(pingMessage);
    }

    sendLocalizationPositionUpdate() {
        var tile = this.trackConfiguration[this.trackTileIndex];
        this.readCaracteristicsMock.mockReadFromDevice(this.createPositionMessage(tile.real_tile_id));

        this.trackTileIndex++;
        if(this.trackTileIndex >= this.trackConfiguration.length-1) {
            this.trackTileIndex = 0;
        }
    }

    createPositionMessage(tileId) {
        var localizationMessage = new Buffer(17);
        localizationMessage.writeUInt8(0x10, 0);
        localizationMessage.writeUInt8(0x27, 1);
        localizationMessage.writeUInt8(0x21, 2);
        //convert int to hex
        var hexValue = tileId.toString(16);
        localizationMessage.writeUInt8("0x" + hexValue, 3);
        localizationMessage.writeUInt8(0x48, 4);
        localizationMessage.writeUInt8(0xe1, 5);
        localizationMessage.writeUInt8(0x86, 6);
        localizationMessage.writeUInt8(0xc2, 7);
        localizationMessage.writeUInt8(0x02, 8);
        localizationMessage.writeUInt8(0x01, 9);
        localizationMessage.writeUInt8(0x47, 10);
        localizationMessage.writeUInt8(0x00, 11);
        localizationMessage.writeUInt8(0x00, 12);
        localizationMessage.writeUInt8(0x00, 13);
        localizationMessage.writeUInt8(0x02, 14);
        localizationMessage.writeUInt8(0xfa, 15);
        localizationMessage.writeUInt8(0x00, 16);
        return localizationMessage;
    }
}

module.exports = CarMock;
