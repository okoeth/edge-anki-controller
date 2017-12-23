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

const request = require('request');
const Tile = require('./tile');
var fs = require('fs');
const TrackConfiguration = require('./track-configuration');

class TrackConfigurationLoader {

    constructor(configurationPath) {
        console.log('Using ' + configurationPath + ' as configuration');
        this.configPath = configurationPath;
    }

    getTrackConfig(callback) {

        var that = this;
        if(!this.trackConfiguration) {
            //Load config from http
            if(this.configPath.indexOf('http') > -1) {
                request({url: this.configPath, json: true}, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("Imported track configuration successfully");

                        that.trackConfiguration = [];
                        for (var index in body) {
                            var tile = body[index];
                            that.trackConfiguration.push(new Tile(tile.id, tile.real_tile_id, tile.type));
                        }

                        if (callback !== undefined)
                            callback(that.trackConfiguration)

                    } else {
                        console.log("Error loading track configuration");
                    }
                });
            } else {
                //Load config from local disc
                if(!fs.existsSync(this.configPath)) {
                    console.log("WARNING: Track configuration does not exist. Please scan with scan <count-tiles> command");
                    if (callback !== undefined) {
                        var trackConfig = new TrackConfiguration([])
                        trackConfig.outdated = true;

                        callback(trackConfig);
                    }
                }
                else {
                    this.trackConfiguration = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

                    if(this.trackConfiguration.version === TrackConfiguration.getCurrentVersion()) {
                        if (callback !== undefined)
                            callback(this.trackConfiguration)
                    }
                    else {
                        console.log("WARNING: Track configuration version outdated. Please rescan with scan <count-tiles> command");
                        this.trackConfiguration.outdated = true;
                        if (callback !== undefined)
                            callback(this.trackConfiguration);
                    }
                }
            }
        } else {
            if(callback !== undefined)
                callback(this.trackConfiguration)
        }
    }
}

module.exports = TrackConfigurationLoader;
