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
var Lane = require('./lane');
var fs = require('fs');

class TrackScanner {

    constructor(car, filename) {
        this.car = car;
        this.filename = filename;

        this.tiles = {};
        this.tileIndex = 0;
        this.transitionReceived = true;
        this.currentLane = 1;
        this.currentCycle = 0;
        this.countTiles = 0;
        this.laneOffsets = [68, 23, -23, -68];

        this.knownTiles = {
            "17": new Tile(undefined, 17, "CURVE"),
            "20": new Tile(undefined, 20, "CURVE"),
            "40": new Tile(undefined, 40, "STRAIGHT"),
            "18": new Tile(undefined, 18, "CURVE"),
            "23": new Tile(undefined, 23, "CURVE"),
            "39": new Tile(undefined, 39, "STRAIGHT"),
            "36": new Tile(undefined, 36, "STRAIGHT")
        }

        this.createCurveSizes(this.knownTiles["17"]);
        this.createCurveSizes(this.knownTiles["20"]);
        this.createCurveSizes(this.knownTiles["18"]);
        this.createCurveSizes(this.knownTiles["23"]);
        this.createStraightSizes(this.knownTiles["40"]);
        this.createStraightSizes(this.knownTiles["39"]);
        this.createStraightSizes(this.knownTiles["36"]);
    }



    createLaneSizes(tile, laneSize1, laneSize2, laneSize3, laneSize4) {
        tile.lane1 = new Lane(laneSize1);
        tile.lane2 = new Lane(laneSize2);
        tile.lane3 = new Lane(laneSize3);
        tile.lane4 = new Lane(laneSize4);
    }

    createStraightSizes(tile) {
        this.createLaneSizes(tile, 560, 560, 560, 560);
    }

    createCurveSizes(tile) {
        this.createLaneSizes(tile, 330, 430, 500, 560);
    }

    messageReceived(message) {
        var that = this;
        if(message !== undefined) {
            if (message instanceof TransitionUpdateMessage) {
                console.log("INFO: Scanning transition update message");
                this.transitionReceived = true;
                this.tileIndex++;
            }
            else if (message instanceof PositionUpdateMessage) {
                console.log("INFO: Scanning position update message");

                if (this.transitionReceived) {
                    var knownTile = undefined;
                    if(this.tiles[this.tileIndex] === undefined) {
                        knownTile = this.knownTiles[message.posTileNo];

                        if(!knownTile) {
                            console.log("WARNING: Tile unknown, please add to known tiles to work properly");
                            this.tiles[this.tileIndex] = new Tile(this.tileIndex, message.posTileNo, "UNKNOWN");
                        }
                        else {
                            this.tiles[this.tileIndex] = new Tile(this.tileIndex, message.posTileNo, knownTile.type);
                        }
                    } else {
                        knownTile = this.knownTiles[message.posTileNo];
                    }

                    var laneKey = "lane" + this.currentLane;

                    //TODO: Refactor all usages of configuration / tiles / lanes
                    if(!knownTile) {
                        //Tile not known, we have no mm info
                        this.tiles[this.tileIndex][laneKey] = new Lane("0");
                        this.tiles[this.tileIndex][laneKey].addPosition(message.posLocation);
                    } else {
                        //Set lane size and add position
                        var knownLane = knownTile[laneKey];
                        this.tiles[this.tileIndex][laneKey] = knownLane;
                        this.tiles[this.tileIndex][laneKey].addPosition(message.posLocation);
                    }

                    this.transitionReceived = false;
                }
                //already seen the tile
                else {
                    var laneKey = "lane" + this.currentLane;
                    this.tiles[this.tileIndex][laneKey].addPosition(message.posLocation)
                }
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
                        that.car.sendCommand("c " + this.currentLane);
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
        fs.writeFile(this.filename, JSON.stringify(new TrackConfiguration(this.tiles)), function (err) {
            if (err) return console.log(err);
            console.log("Configuration file written");
        })
    }
}

module.exports = TrackScanner;
