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
var PositionUpdateMessage = require('./messages/position-update-message');
var TransitionUpdateMessage = require('./messages/transition-update-message');
var Tile = require('./tile');
var TrackConfiguration = require('./track-configuration');
var fs = require('fs');

class TrackScanner {

    constructor(car) {
        this.car = car;

        this.tiles = {};
        this.tileIndex = 0;
        this.transitionReceived = true;
        this.currentLane = 1;
        this.currentCycle = 0;
        this.countTiles = 0;
        this.laneOffsets = [68, 23, -23, -68];
    }



    messageReceived(message) {
        var that = this;
        if(message !== undefined) {
            if (message instanceof PositionUpdateMessage) {
                console.log("INFO: Scanning position update message");

                if (this.transitionReceived) {
                    if(this.tiles[this.tileIndex] === undefined)
                        this.tiles[this.tileIndex] = new Tile(this.tileIndex, message.posTileNo, "UNKNOWN");
                    this.tiles[this.tileIndex]["laneNo" + this.currentLane][message.posLocation] = message.posLocation;
                    this.transitionReceived = false;
                }
                //already seen the tile
                else {
                    this.tiles[this.tileIndex]["laneNo" + this.currentLane][message.posLocation] = message.posLocation;
                }
            }
            else if (message instanceof TransitionUpdateMessage) {
                console.log("INFO: Scanning transition update message");
                this.transitionReceived = true;
                this.tileIndex++;
            }

            if (this.tileIndex >= this.countTiles) {
                this.tileIndex = 0;
                this.currentCycle++;

                if (this.currentCycle >= 2) {
                    this.currentLane++;
                    //Switch lanes
                    this.currentCycle = 0;

                    if (this.currentLane > 4) {
                        this.car.sendCommand("s 0");
                        console.log("INFO: Scanning completed");
                        this.car.removeListener("messageReceived", this.messageReceived.bind(this));
                        this.configCompleted();
                    }

                    else
                        that.car.sendCommand("c " + this.laneOffsets[this.currentLane-1]);


                }
            }

            console.log("INFO: Current scanned config: " + JSON.stringify(this.tiles));
        }
    }

    scanTrack(countTiles) {
        //Let the car drive slowly (150)
        this.car.sendCommand("s 300");

        console.log('INFO: Starting scan');

        this.countTiles = countTiles;

        //Get the position and transition messages
        this.car.on('messageReceived', this.messageReceived.bind(this));

        //Build up track configuration structure
    }

    configCompleted() {
        fs.writeFile('track-config.json', JSON.stringify(this.tiles), function (err) {
            if (err) return console.log(err);
            console.log("Configuration file written");
        })
    }
}

module.exports = TrackScanner;
