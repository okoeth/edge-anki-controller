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

////////////////////////////////////////////////////////////////////////////////
// Read configuration file
module.exports = function() {
    return {
      "read" : function(propertiesFileName, callback) {
        if (!propertiesFileName) {
          console.error('Provide configuration filename as parameter, e.g. node controller.js config-car1.properties');
          process.exit(1);
        }
        properties.parse('./' + propertiesFileName, {path: true}, function(err, cfg) {
          if (err) {
            console.error('Error parsing the configuration file - see config-sample.properties for an example');
            process.exit(1);
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
              callback(cfg.carno, cfg.carid, cfg.startlane);
        });
    }
  }
};
