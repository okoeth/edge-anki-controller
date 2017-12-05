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

var kafka = require('kafka-node');
const EventEmitter = require('events');

var kafkaEdgeServer = process.env.KAFKA_EDGE_SERVER;
var kafkaCloudServer = process.env.KAFKA_CLOUD_SERVER;

class Kafka extends EventEmitter {

    constructor(carNo) {
        super();
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
        this.kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaEdgeServer+':9092'});
        this.kafkaProducer = new kafka.Producer(kafkaClient);

        this.kafkaProducer.on('ready', function () {
            console.log('Kafka producer is ready.');
        });

        this.kafkaProducer.on('error', function (err) {
            console.log('Error in Kafka producer: '+err);
        });

        console.log('INFO: Connection Kafka Consumer on Topic Command'+carNo);
        this.kafkaConsumer = new kafka.Consumer(
            that.kafkaClient,
            [
                { topic: 'Command'+carNo, partition: 0 }
            ],
            {
                autoCommit: true
            }
        );

        this.kafkaConsumer.on('message', function (message) {
            console.log('INFO: Received: ', message);
            that.emit('message', message);
        });

        this.kafkaConsumer.on('error', function (err) {
            console.log('ERROR: Error in Kafka consumer: '+err);
        });

        this.kafkaConsumer.on('offsetOutOfRange', function (err) {
            console.log('ERROR: Error offsetOutOfRange in Kafka consumer: '+err);
        });
    }

    sendMessage(message) {
        console.log("INFO: Kafka SendMessage invoked: ", message);
        this.kafkaProducer.send([{topic: 'Status', messages: message, partition: 0}],
            function (err, data) {
                if (err!=null) {
                    console.log("ERROR: Error sending message: ", err);
                }
            }
        );
    }

}

module.exports = Kafka;