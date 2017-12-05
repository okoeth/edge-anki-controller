# Controller for Anki Overdrive 
This controller receives commands via Kafka (topic: Control) and relays them to Anki Overdrive 
cars through Bluetooth LE. Currently, the BLE libraray only workds on newer MacBooks with 
Bluetooth 4.0 stacks. Windows or Unix machines are currently not supported by the underlying
library.

## Configuration
First and foremost install the dependencies using:
```
npm install
npm install -g kafkacat
```

The controller needs the car IDs to connect to the cars. The IDs can be retrieved using the 
doscovery service:
```
node discover.js
```

Pick the ID of the car and and create a `config-car1.properties`from the sample configuration 
provided. Sample configuration for a car from Ensō:
```
# Bluetooth config (mandatory)

# Car ID from discovery
carid=adf93c91ff4543638bfd905af63a4a36

# Start lane: 1/right - 4/left, clockwise, default: 1
startlane=1

# Car No (1-4)
carno=1
```

By default, the Kafka server is expected to listen on 127.0.0.1. If another server is being used, the server IPs for edge and cloud can be configured through the respective env variables:
```
export KAFKA_EDGE_SERVER=v.x.y.z
export KAFKA_CLOUD_SERVER=v.x.y.z
```

For running Kafka in Docker see TODO

### Configuration of Anki track

You can create a configuration file with the track scanner. Simply run the command scan <no_of_tiles> when you started controller.js. <no_of_tiles> should be set to the number of tiles that you have on your track.

## Running locally
The service can be started locally by running
```
node controller.js --config <config-filename> 
```

Kafka messages can be produced and consumed from command line using:
```
kafkacat -P -b 127.0.0.1:9092 -t Command
kafkacat -C -b 127.0.0.1:9092 -t Status
```

## Running mocked

The service can be used in a mocked way (for Kafka and noble (bluetooth)). So it is possible to run it without a bluetooth dongle and without having Kafka installed. The first parameter is the mock for Kafka, the second is the mock for bluetooth.

`node controller.js <config-filename> --kafka mock --noble mock`

When running in mocked mode, the service will read the configuration file from Github (https://github.com/cloudwan/edge-anki-config) and send dummy position data of the track from the configuration file.

## Command line arguments

| Argument      | Short form | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| --config      | -c         | Sets the car configuration. Default is config-car1.properties. |
| --kafka       | -k         | Sets kafka. Could be mock or anything else to use kafka as default. |
| --noble       | -n         | Sets noble. Could be mock or anything else to use noble as default. |
| --trackConfig | -t         | Sets the track configuration. The scanner create a file under ./track-config.json |

## References

* [node](https://nodejs.org/en/download/)
* [npm](https://docs.npmjs.com/getting-started/installing-node)
* [git](https://git-scm.com/downloads)
