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

class TrackConfiguration {

    constructor() {
        this.github_config_url = process.env.EDGE_GITHUB_URL;
        if (this.github_config_url==null){
            console.log('Using https://raw.githubusercontent.com/cloudwan/edge-anki-config/master/track-config.json as default configuration repository');
            this.github_config_url='https://raw.githubusercontent.com/cloudwan/edge-anki-config/master/track-config.json'
        }
    }

    getTrackConfig(callback) {
        if(!this.trackConfiguration) {
            request(this.github_config_url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("Imported track configuration successfully");
                    this.trackConfiguration = JSON.parse(body);

                    if(callback !== undefined)
                        callback(this.trackConfiguration)
                } else {
                    console.log("Error loading track configuration");
                }
            });
        }
        else {
            if(callback !== undefined)
                callback(this.trackConfiguration)
        }
    }
}

module.exports = TrackConfiguration;
