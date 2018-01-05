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
class MultiGateway extends EventEmitter {

    constructor(kafkaGateway, httpGateway) {
        super();
        var that = this;
        that.kafkaGateway = kafkaGateway;
        that.httpGateway = httpGateway;

        kafkaGateway.on('message', function(message) {
            that.emit('message', message);

        });

        httpGateway.on('message', function(message) {
            that.emit('message', message);
        });
    }

    sendMessage(message) {
        this.kafkaGateway.sendMessage(message);
        this.httpGateway.sendMessage(message);
    }

    disconnect() {
        this.kafkaGateway.disconnect();
    }

}

module.exports = MultiGateway;