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

const Tile = require('./tile');
const PosOption = require('./pos-option');

class TilePositionCalculator {

    constructor(trackConfiguration) {
        this.setTrackConfiguration(trackConfiguration);
    }

    setTrackConfiguration(trackConfiguration) {
        this.trackConfiguration = trackConfiguration;
    }

    getCarPosition(ankiTileId, previousTileIndex) {

        //TODO: Somehow its hanging here
        if(!this.trackConfiguration)
            return -1;

        //find all possible tiles (anki tiles have no unique id)
        var possibleTiles = [];

        //we know where the car was previously,
        //we search the next tile with the right anki tile id
        if(previousTileIndex > -1) {
            var previousTileId = this.trackConfiguration[previousTileIndex].id;
            var previousTileFound = false;
            var index = 0;
            var loopsCompleted = 0;

            while(true) {
                var normalizedIndex = index % Object.keys(this.trackConfiguration).length;

                //Safety first, should anyway not happen
                if(loopsCompleted >= 2) {
                    return [];
                }

                //We found the tile
                if(this.trackConfiguration[normalizedIndex].id === previousTileId) {
                    previousTileFound = true;
                }

                if (previousTileFound && this.trackConfiguration[normalizedIndex].realId == ankiTileId) {
                        return [ new PosOption(this.trackConfiguration[normalizedIndex].id, 1)];
                }
                index++;
                if(index % this.trackConfiguration.length === 0)
                    loopsCompleted++;
            }
        }
        //We have no info about our last position, get all possibilities
        else {
            for (var index in this.trackConfiguration) {
                var tile = this.trackConfiguration[index];

                if (tile.realId === ankiTileId)
                    possibleTiles.push(new PosOption(tile.id, 1));
            }

            //set equal probabilities for all tiles
            for(var index = 0; index < possibleTiles.length; index++) {
                possibleTiles[index].optProbability = 1/possibleTiles.length;
            }
            return possibleTiles;
        }
    }

    getNextTileIndex(currentTileIndex) {
        var newTileIndex = currentTileIndex+1;
        if(newTileIndex == Object.keys(this.trackConfiguration).length) {
            newTileIndex = 0;
        }
        return newTileIndex;
    }

    getIndexFromTileId(tileId) {
        for(var key in this.trackConfiguration) {
            if(this.trackConfiguration[key].id == tileId)
                return parseInt(key);
        }
    }

    getLane(tileIndex, posLocation) {
        var tile = this.trackConfiguration[tileIndex];

        if(tile.lane1[posLocation] !== undefined) {
            return 1;
        } else if(tile.lane2[posLocation] !== undefined) {
            return 2;
        } else if(tile.lane3[posLocation] !== undefined) {
            return 3;
        } else if(tile.lane4[posLocation] !== undefined) {
            return 4;
        }
        return undefined;
    }
}

module.exports = TilePositionCalculator;
