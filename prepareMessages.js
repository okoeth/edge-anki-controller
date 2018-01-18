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

module.exports = function() {
  return {
  	"doc" : function() {
		var output = "Available Commands:\n";
		output = output + "s [speed] [accel] - Set speed\n";
		output = output + "  - speed, default: 500, valid: 250? - 1000?\n";
		output = output + "  - accel, default: 12500, valid: 6250? - 25000?\n";
		output = output + "e - End / set speed to zero\n";
		output = output + "c [offset] - Change lange\n";
		output = output + "  - offset, default: 0, valid: (-68) - (+68)\n";
		output = output + "o [offset] - Set initial offset\n";
		output = output + "  - offset, default: 0, valid: (-68) - (+68)\n";
		output = output + "l - Change lights\n";
		output = output + "lp - Change lights pattern\n";
		output = output + "sdk [on/off] - Turn on/off SDK\n";
		output = output + "  - on/off, default: on, valid: on, off\n";
		output = output + "ping - Ping car\n";
		output = output + "bat - Get battery level\n";
		output = output + "ver - Get version\n";
		output = output + "q - Disconnect and quit\n";
		output = output + "help - Get help documentation";
		return output;
  	},
    "format" : function(command) {    
  
  	  var message = null;
  	  var cmd;
  	  var commandArray;
	  if (command.indexOf(' ') == -1) {
	  	cmd = command;
	  }
	  else {
	  	commandArray = command.split(' ');
      	if (commandArray.length > 0) {
          cmd = commandArray[0];
	  	}
	  }

	  if (cmd == "s") { // set speed
		// input parameter 1: speed, default: 500, valid: 250? - 1000?
		// input parameter 2: accel, default: 12500, valid: 6250? - 25000?
		var speed = 500;
		var accel = 12500;

		if (commandArray) {
	      if (commandArray.length > 1) {	
          	speed = commandArray[1];
	  	  }
	  	  if (commandArray.length > 2) {	
          	accel = commandArray[2];
	  	  }
	  	}

	    message = new Buffer(7);
	    message.writeUInt8(0x06, 0);
	    message.writeUInt8(0x24, 1);
	    message.writeInt16LE(speed, 2); 
	    message.writeInt16LE(accel, 4);                          
	  }

	  if (cmd == "e") { // end/set speed to zero
	    message = new Buffer(7);
	    message.writeUInt8(0x06, 0);
	    message.writeUInt8(0x24, 1);
	    message.writeInt16LE(0x00, 2); 
	    message.writeInt16LE(12500, 4);                          
	  }

	  if (cmd == "c") { // change lane
	    var lane = 1;
	    //lane offsets where 68 is most inner and -68 most outer
		var laneOffsets = [68, 23, -23, -68];

	    if (commandArray) {
	      if (commandArray.length > 1) {	
          	lane = commandArray[1];

          	if(lane < 0 || lane > 4)
          		lane = 1;
	  	  }
	  	}

	  	var laneOffset = laneOffsets[lane-1];

	    message = new Buffer(12);
	    message.writeUInt8(11, 0);
	    message.writeUInt8(0x25, 1);
		message.writeInt16LE(250, 2);
	    message.writeInt16LE(1000, 4);    
	    message.writeFloatLE(laneOffset, 6);
	  }

	  if (cmd == "o") { // set offset
	  	// example: o -23
	  	// input parameter 1: offset, default: 0, valid: -68 - 68
	    var offset = -68.0;

	    if (commandArray) {
	      if (commandArray.length > 1) {	
          	offset = commandArray[1];
	  	  }
	  	}

	    message = new Buffer(6);
	    message.writeUInt8(0x05, 0);
	    message.writeUInt8(0x2c, 1);
	    message.writeFloatLE(-68.0, 2);    
	  }

      if (cmd == "l") { // change lights
        // something happens but I don't understand the parameters yet
	    message = new Buffer(3);
	    message.writeUInt8(0x02, 0);
	    message.writeUInt8(0x1d, 1);
	    message.writeUInt8(140, 2);
	    }

	  if (cmd == "lp") { // change lights pattern
	    // something happens but I don't understand the parameters yet
	    message = new Buffer(8);
	    message.writeUInt8(0x07, 0);
	    message.writeUInt8(0x33, 1);
	    message.writeUInt8(5, 2);
	    message.writeUInt8(1, 3);
	    message.writeUInt8(1, 4);
	    message.writeUInt8(5, 5);
	    message.writeUInt16BE(0, 6);
	  }

	  if (cmd == "sdk") { // turn on sdk
	  	var value = "on";
		if (commandArray) {
	      if (commandArray.length > 1) {	
          	paramValue = commandArray[1];
          	if (paramValue == "off") value = "off";
	  	  }
	  	}

	    message = new Buffer(4);
	    message.writeUInt8(0x03, 0);
	    message.writeUInt8(0x90, 1);
	    if (value == "on") {
	      message.writeUInt8(0x01, 2);
	    }
	    else {
	      message.writeUInt8(0x00, 2);
	      console.log('off');
	    }
	    message.writeUInt8(0x01, 2);
	  }

	  if (cmd == "ping") { // ping
	    message = new Buffer(2);
	    message.writeUInt8(0x01, 0);
	    message.writeUInt8(0x16, 1);                      
	  }

	  if (cmd == "bat") { // request battery level
	    message = new Buffer(2);
	    message.writeUInt8(0x01, 0);
	    message.writeUInt8(0x1a, 1);                    
	  }

	  if (cmd == "ver") { // request version
	    message = new Buffer(2);
	    message.writeUInt8(0x01, 0);
	    message.writeUInt8(0x18, 1);                   
	  }

	  if (cmd == "q") { // quit - stop and disconnect
	    message = new Buffer(2);
	    message.writeUInt8(0x01, 0);
	    message.writeUInt8(0x0d, 1);                   
	  }

	  return message; 	
	}
  };
};