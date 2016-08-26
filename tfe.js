/*
 * TESTBENCH FRONT END (tfe)
*/

// ===== REQUIRED PACKAGES =====
var http = require("http");
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var querystring = require('querystring');
var fs = require('fs');

// ===== LOCAL LIBRARIES =====
var dutlib = require('./jsobjects/dut.js');
var testbenchlib = require('./jsobjects/testbench.js');

// read hardware controller config JSON file
var config = JSON.parse(fs.readFileSync('config/config_testbench.json', 'utf8'));
var remote = config.remoteurl + ':' + config.remoteport;

// configure Testbench for periodic advertisements using config file
var ANNOUNCE_PERIOD = 10*1000;
console.log('Initializing testbench Type: [' + config.type + '], Id: [' + config.id + ']' );
var testbench = new testbenchlib.Testbench(config.type, config.id, config.localport);
numDuts = config.duts.length;
for( var i=0; i<numDuts; i++ ){
	d = config.duts[i];
	dut = new dutlib.Dut(d.type, d.id, d.path);
	console.log('     ...adding DUT [' + d.name + '] at ' + dut.path);
	testbench.addDut( dut );
}

// creating the node.js express app
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false }));

// =============== HTTP PROTOCOL HOOKS ===============
// DUT Firmware Programming
app.post('/dut/program', function(req, res, next) {
	var target = req.body.dut;
	var firmware = req.body.firmware;
	console.log('Firmware uploading for: ', target);
	var size = 0;
	var binfile = new Buffer('');

	req.on('data', function (chunk) {
        binfile = Buffer.concat([binfile, chunk]);
    });

    req.on('end', function () {
        console.log("total size = " + binfile.length);
        fs.writeFile("./log", binfile, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		}); 

		// TODO: Program specified target
		// !!!

        res.end("Upload complete");
        console.log("Upload complete");
    }); 

    req.on('error', function(e) {
        console.log("ERROR ERROR: " + e.message);
    });

	var data = new Buffer('');
  req.on('data', function(chunk) {
      data = Buffer.concat([data, chunk]);
  });
  req.on('end', function() {
    req.rawBody = data;
    next();
  });

});

// DUT Reset
app.post('/dut/reset', function(req, res, next) {
	var target = req.body.dut;
	console.log('Reset requested for DUT #', target);
	// TODO: Reset specified target
	// !!!
	res.end()
});

// CONTROLLER test waveform file
app.post('/ctrl/waveform', function(req, res, next) {
	var target = req.body.dut;
	console.log('Output waveform uploaded', target);
	// TODO: Reset specified target
	// !!!
	res.end()
});

// =============== ANNOUNCE TESTBED TO SERVER ===============
function announcePresence() {
	// determine connected devices
	console.log("announcing testbed to server...");
	request({
		uri: "http://" + remote + "/testbench",
		method: "POST",
		form: {
			testbench: JSON.stringify(config)
		}
	}, function(error, response, body) {
		// do nothing with server error or response
	});
	setTimeout(announcePresence, ANNOUNCE_PERIOD);
}
setTimeout(announcePresence, ANNOUNCE_PERIOD);

// =============== FIRE UP THE SERVER ===============
var server = http.createServer(app);
server.listen(config.localport, 'localhost');
console.log("HTTP server listening on %d", config.localport);
