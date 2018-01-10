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

        console.debug("entering getCarPosition");

        if(!this.trackConfiguration)
            return -1;
        console.debug("after this.trackConfiguration");

        //find all possible tiles (anki tiles have no unique id)
        var possibleTiles = [];

        //we know where the car was previously,
        //we search the next tile with the right anki tile id
        if(previousTileIndex > -1) {
            console.debug("after previousTileIndex > -1");

            var previousTileId = this.trackConfiguration.tiles[previousTileIndex].id;
            console.debug("after previousTileId");

            var previousTileFound = false;
            var index = 0;
            var loopsCompleted = 0;
            var countTiles = Object.keys(this.trackConfiguration.tiles).length;
            if (!countTiles) {
                countTiles = 8;
            }

            //This condition just prevents an endless loop
            while(index <= 16) {
                console.debug("entering while true");
                console.debug("index:" + index);

                var normalizedIndex = index % countTiles;
                console.debug("after normalized Index");

                //Safety first, should anyway not happen
                if(loopsCompleted >= 2) {
                    console.debug("after loops completed >= 2");
                    return [];
                }
                console.debug("after loops completed < 2");

                //We found the tile
                if(this.trackConfiguration.tiles[normalizedIndex].id === previousTileId) {
                    console.debug("after this.trackConfiguration.tiles[normalizedIndex].id === previousTileId");
                    previousTileFound = true;
                }
                console.debug("after this.trackConfiguration.tiles[normalizedIndex].id: " + previousTileFound);

                if (previousTileFound && this.trackConfiguration.tiles[normalizedIndex].realId == ankiTileId) {
                    console.debug("after previousTileFound && this.trackConfiguration.tiles[normalizedIndex].realId == ankiTileId: ");

                        return [ new PosOption(this.trackConfiguration.tiles[normalizedIndex].id, 1)];
                }
                console.debug("after nothing found ");

                index++;
                if(index % countTiles === 0) {
                    console.debug("after loops completed: ");
                    loopsCompleted++;
                }

                console.debug("next loop");
            }
        }
        //We have no info about our last position, get all possibilities
        else {
            console.log("after else");
            for (var index in this.trackConfiguration.tiles) {
                console.log("loop this.trackConfiguration.tiles " + index);
                var tile = this.trackConfiguration.tiles[index];

                if (tile.realId === ankiTileId)
                    possibleTiles.push(new PosOption(tile.id, 1));
            }

            //set equal probabilities for all tiles
            console.log("before probability");
            for(var index = 0; index < possibleTiles.length; index++) {
                possibleTiles[index].optProbability = ((1/possibleTiles.length)*100)|0;
            }
            console.log("after probability");
            return possibleTiles;
        }
    }

    getNextTileIndex(currentTileIndex) {
        var newTileIndex = currentTileIndex+1;
        if(newTileIndex == Object.keys(this.trackConfiguration.tiles).length) {
            newTileIndex = 0;
        }
        return newTileIndex;
    }

    getIndexFromTileId(tileId) {
        for(var key in this.trackConfiguration.tiles) {
            if(this.trackConfiguration.tiles[key].id == tileId)
                return parseInt(key);
        }
    }

    getLaneLength(tile, laneNo) {
        return tile["lane" + laneNo].sizeMM;
    }

    /**
     * Calculates the lane based on all possible locations
     * If the possible locations imply different lanes,
     * undefined is returned
     * @param posOptions The possible tile numbers of the car
     * @param posLocation The location within a tile sent by anki
     * @returns {undefined}
     */
    getLaneNo(posOptions, posLocation) {
        var proposedLane = undefined;
        var positionPrefix = this.getPositionPrefix(posLocation);

        for(var index in posOptions) {
            var tile = this.trackConfiguration.tiles[posOptions[index].optTileNo];
            var currentLane = undefined;

            //First try to find tile directly
            if(tile.lane1.positions[posLocation] !== undefined) {
                currentLane = 1;
            } else if(tile.lane2.positions[posLocation] !== undefined) {
                currentLane = 2;
            } else if(tile.lane3.positions[posLocation] !== undefined) {
                currentLane = 3;
            } else if(tile.lane4.positions[posLocation] !== undefined) {
                currentLane = 4;
            }

            //Then try to find by prefix
            if(currentLane === undefined && !this.trackConfiguration.outdated) {
                var lane1TilePositionPrefix = this.getPositionPrefix(this.getMedianPositionItem(tile.lane1.positions));
                var lane2TilePositionPrefix = this.getPositionPrefix(this.getMedianPositionItem(tile.lane2.positions));
                var lane3TilePositionPrefix = this.getPositionPrefix(this.getMedianPositionItem(tile.lane3.positions));
                var lane4TilePositionPrefix = this.getPositionPrefix(this.getMedianPositionItem(tile.lane4.positions));

                if (lane1TilePositionPrefix === positionPrefix) {
                    currentLane = 1;
                } else if (lane2TilePositionPrefix === positionPrefix) {
                    currentLane = 2;
                } else if (lane3TilePositionPrefix === positionPrefix) {
                    currentLane = 3;
                } else if (lane4TilePositionPrefix === positionPrefix) {
                    currentLane = 4;
                }
            }

            if(!proposedLane) {
                proposedLane = currentLane;
            }
            else if(proposedLane !== currentLane)
                return undefined;
        }
        return proposedLane;
    }

    /***
     * Get the median item of the positions
     * @param positions (tile positions)
     * @returns {*}
     */
    getMedianPositionItem(positions) {
        var medianIndex = Math.round((Object.keys(positions).length / 2))-1;
        if(medianIndex < 0)
            medianIndex = 0;

        var currentIndex = 0;
        for(var laneKey in positions) {
            if(currentIndex === medianIndex)
                return positions[laneKey];
            currentIndex++;
        }
    }

    getPositionPrefix(position) {
        var posLocationString = position.toString();
        var lanePrefix = posLocationString[0];
        if(posLocationString.length === 1) {
            lanePrefix = '0';
        }
        return lanePrefix
    }

    getFirstTilePosition(tile, laneNo) {
        try {
            if (tile["lane" + laneNo] === undefined) {
                console.log("WARNING: No lane positions for lane " + laneNo);
                return undefined;
            }

            console.log("DEBUG: Lane positions" + tile["lane" + laneNo].positions)
            var positions = tile["lane" + laneNo].positions;


            for (var key in positions) {
                return positions[key];
            }
        }
        catch(error) {
            throw error;
        }
    }

    getTileByIndex(tileIndex) {
        return this.trackConfiguration.tiles[tileIndex];
    }

    getMaxTileNo() {
        return Object.keys(this.trackConfiguration.tiles).length;
    }
}

module.exports = TilePositionCalculator;
