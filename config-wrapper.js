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

var properties = require('properties');
var fs = require('fs');

////////////////////////////////////////////////////////////////////////////////
// Read configuration file
module.exports = function() {
    return {
      "write": function(carNo, carInitBluetoothId, carLaneNo, propertiesFileName) {
          var propertiesString = "carno=" + carNo + "\n";
          propertiesString += "carid=" + carInitBluetoothId + "\n";
          propertiesString += "startlane=" + carLaneNo + "\n";

          fs.writeFileSync('./' + propertiesFileName, propertiesString);
          console.log("INFO: Config file written to ./" + propertiesFileName + ". Shutting down.");
          process.exit(0);
      },
      "read" : function(propertiesFileName, callback) {
        var that = this;
        if (!propertiesFileName) {
          console.error('Provide configuration filename as parameter, e.g. node controller.js config-car1.properties');
          process.exit(1);
        }
        properties.parse('./' + propertiesFileName, {path: true}, function(err, cfg) {
          if (err) {
            if(err.code == 'ENOENT') {
                console.log("INFO: Initial config does not exist, writing config from environment variables");
                var carNo = process.env.CAR_NO;
                var carInitBluetoothId = process.env.CAR_INIT_BLUETOOTH_ID;
                var carLaneNo = process.env.CAR_LANE_NO;

                if(carLaneNo == -1) {
                    carLaneNo = 1;
                }

                console.log("INFO: Writing config file with ", carNo, carInitBluetoothId, carLaneNo);

                if(!carNo || !carInitBluetoothId || !carLaneNo) {
                  console.error("Please set the environment variables CAR_NO, CAR_INIT_BLUETOOTH_ID and CAR_LANE_NO");
                  process.exit(1)
                }

                that.write(carNo, carInitBluetoothId, carLaneNo, propertiesFileName);
            }
            else {
                console.error('Error parsing the configuration file: ', err);
                process.exit(1);
            }
          }
          if (!cfg.carid) {
            console.error('Error parsing car id of the configuration file - see config-sample.properties for an example');
            process.exit(1);
          }
          if (!cfg.carno) {
            console.error('Error parsing car no of the configuration file - see config-sample.properties for an example');
            process.exit(1);
          }
          console.log('Configuration read from '+propertiesFileName+': ', cfg);

          if(callback !== undefined)
              callback(parseInt(cfg.carno), cfg.carid, cfg.startlane);
        });
    }
  }
};
