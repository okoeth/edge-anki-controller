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

var kafkaEdgeServer = process.env.KAFKA_EDGE_SERVER;
var kafkaCloudServer = process.env.KAFKA_CLOUD_SERVER;

class Kafka extends EventEmitter {

    constructor(carNo) {
        super();
        var Kafka = require('node-rdkafka');

        var that = this;
        if (kafkaEdgeServer==null || kafkaEdgeServer==''){
            console.log('Using 127.0.0.1 as default Kafka edge server.');
            kafkaEdgeServer='127.0.0.1'
        }

        if (kafkaCloudServer==null || kafkaCloudServer==''){
            console.log('Using 127.0.0.1 as default Kafka cloud server.');
            kafkaCloudServer='127.0.0.1'
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Set-up Kafak client, producer, and consumer
        that.kafkaProducer = new Kafka.Producer({
            'metadata.broker.list': kafkaEdgeServer+':9092'
            //'queue.buffering.max.messages': 1
        });

        that.kafkaProducer.connect();
        that.kafkaProducer.on('ready', function () {
            console.log('Kafka producer is ready.');
        });

        // Any errors we encounter, including connection errors
        that.kafkaProducer.on('event.error', function(err) {
            console.error('Error in kafka producer');
            console.error(err);
        });

        that.kafkaConsumer = new Kafka.KafkaConsumer({
            'group.id': 'kafka',
            'metadata.broker.list': kafkaEdgeServer+':9092',
            'enable.auto.offset.store': false
        }, {});

        // Flowing mode
        that.kafkaConsumer.connect();

        that.kafkaConsumer
            .on('ready', function() {
                that.kafkaConsumer.subscribe(['Command' + carNo]);

                // Consume from the Command topic. This is what determines
                // the mode we are running in. By not specifying a callback (or specifying
                // only a callback) we get messages as soon as they are available.
                that.kafkaConsumer.consume();
            })
            .on('data', function(data) {
                // Output the actual message contents
                var latency = new Date().getTime()-data.timestamp;
                console.log('INFO: Received kafka message at ' + new Date(), +  ' with latency: ' + latency + "ms, " + data.value.toString());
                that.emit('message', data.value.toString());
            })
            .on('disconnected', function() {
                console.log("INFO: Kafka consumer disconnected");
            })
            .on('event.error', function(err) {
                console.log("INFO: Kafka consumer error " + err);

            });
    }

    sendMessage(message) {
        console.log("INFO: Kafka SendMessage invoked: ", message);
        try {
            if(this.kafkaProducer.isConnected()) {
                this.kafkaProducer.produce(
                    // Topic to send the message to
                    'Status',
                    // optionally we can manually specify a partition for the message
                    // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
                    0,
                    // Message to send. Must be a buffer
                    new Buffer(JSON.stringify(message))
                );
            }
        } catch (err) {
            console.error('A problem occurred when sending our message');
            console.error(err);
        }
    }

    disconnect() {
        this.kafkaConsumer.disconnect();
    }

}

module.exports = Kafka;