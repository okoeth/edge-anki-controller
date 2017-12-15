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

var CarMessage = require('./car-message');

class PositionUpdateMessage extends CarMessage {

    constructor(msgID, msgName, msgTimestamp, posLocation, posTileNo, laneOffset, carSpeed) {
        super(msgID, msgName, msgTimestamp);
        this.posLocation = posLocation;
        this.posTileNo = posTileNo;
        this.laneOffset = laneOffset;
        this.carSpeed = carSpeed;
        //laneNo has to be calculated
        this.laneNo = null;
        this.laneLength = null;
        this.posTileType = null;
        //internal position has to be calculated
        this.posOptions = [];
        this.maxTileNo = 0;
    }
}

module.exports = PositionUpdateMessage;
