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

var PositionCalculator = require("./anki/tile-position-calculator");
var ankiPositionCalculator = new PositionCalculator();

module.exports = function() {
  return {
    "handle" : function(data, kafka) {

	    var messageId = data.readUInt8(1);
	    var date = new Date();

	    if (messageId == '23') {
	      // example: <Buffer 01 17>
	      var desc = 'Ping Response Received';
				//console.log('Message: ' + messageId, data, desc);
				kafka.sendMessage('{ "status_id"   : "' + messageId + '",'+
                    '  "status_name" : "' + desc +'" }');
	    }

	    else if (messageId == '25') {
	      // example: <Buffer 05 19 6e 26 00 00>
	      var desc = 'Version Received';
	      var version = data.readUInt16LE(2);
	      //console.log('Message: ' + messageId, data, desc + ' - version: ' + version);
			kafka.sendMessage('{ "status_id"   : "' + messageId + '",'+
                '  "status_name" : "' + desc + '",'+
                '  "version"     : '  + version + ' }');
	    }

	    else if (messageId == '27') {
	      // example: <Buffer 03 1b 50 0f>
	      var desc = 'Battery Level Received';
	      var level = data.readUInt16LE(2);
	      //console.log('Message: ' + messageId, data, desc + ' - level: ' + level);
				kafka.sendMessage(
					'{ "status_id"   : "' + messageId + '",'+
					'  "status_name" : "' + desc + '",'+
					'  "level"       : '  + level + ' }'
				);
	    }

	    else if (messageId == '39') { 
	      // example: <Buffer 10 27 21 28 48 e1 86 c2 02 01 47 00 00 00 02 fa 00>
	      var desc = 'Localization Position Update Received';
	      var pieceLocation = data.readUInt8(2);
	      var realPieceId = data.readUInt8(3); // in my starter kit:
		  var internalPieceId = ankiPositionCalculator.getCarPosition(realPieceId);
	      // 1 x straight: 36
	      // 1 x straight: 39
	      // 1 x straight: 40
	      // 1 x curve: 20
	      // 1 x curve: 23
	      // 2 x curve: 18
	      // 2 x curve: 17
	      // 1 x start/finish: 34 (long) and 33 (short)
	      var offset = data.readFloatLE(4);
	      var speed = data.readUInt16LE(8);
	      //console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset + ' speed: ' + speed + ' - realPieceId: '  + realPieceId + ' pieceLocation: ' + pieceLocation);;	     
				kafka.sendMessage(
					'{ "status_id"      : "' + messageId + '",'+
					'  "status_name"    : "' + desc + '",'+
					'  "piece_location" : '  + pieceLocation + ','+
					'  "real_piece_id"  : '  + realPieceId + ','+
                    '  "piece_id"       : '  + internalPieceId + ','+
					'  "offset"         : '  + offset + ','+
					'  "speed"          : '  + speed + ' }'
				);
	    }

	    else if (messageId == '41') { 
	      // example: <Buffer 12 29 00 00 02 2b 55 c2 00 ff 81 46 00 00 00 00 00 25 32>
	      var desc = 'Localization Transition Update Received';
				var offset = data.readFloatLE(4);
				//console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);
				kafka.sendMessage(
					'{ "status_id"   : "' + messageId + '",'+
					'  "status_name" : "' + desc + '",'+
					'  "offset"      : '  + offset + ' }'
				);
	    }

	    else if (messageId == '43') { 
		  	// example: <Buffer 01 2b>
	      var desc = 'Vehicle Delocalized Received';
	      console.log('Message: ' + messageId, data, desc);
	    }

	    else if (messageId == '45') { 
	      // example: <Buffer 06 2d 00 c8 75 3d 03>
				var desc = 'Offset from Road Center Update Received';
				var offset = data.readFloatLE(2);
	      //console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);
				kafka.sendMessage(
					'{ "status_id"   : "' + messageId + '",'+
					'  "status_name" : "' + desc +'" }'
				);
	    }

	    else if (messageId == '54') {
	      // example: <Buffer 03 36 00 00>
	      //console.log('Message: ' + messageId, data, 'Not documented');   
	    }

	    else if (messageId == '63') {
	      // example: <Buffer 05 3f 01 00 00 01>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '65') {
	      // example: <Buffer 0e 41 9a 99 7f 42 9a 99 7f 42 00 00 00 02 81>
	      var desc = 'Changed Offset (not documented)';
				var offset = data.readFloatLE(2);
				//console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);
				kafka.sendMessage(
					'{ "status_id"   : "' + messageId + '",'+
					'  "status_name" : "' + desc + '",'+
					'  "offset"      : '  + offset + ' }'
				);
	    }

	    else if (messageId == '67') {
	      // example: <Buffer 01 43>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '77') {
	      // example: <Buffer 03 4d 00 01>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '134') {
	      // example: <Buffer 0b 86 8e 00 27 08 00 00 10 10 00 00>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '201') {
	      // example: tbd
	      //console.log('Message: ' + messageId, data, 'Not documented');                       
	    }

	    else {
	      //console.log('Message: ' + messageId, data, 'Unknown');
	    }  	
		}
  };
};
