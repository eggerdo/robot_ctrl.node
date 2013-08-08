FORWARD 			= "FORWARD";
STRAIGHT_FORWARD	= "STRAIGHT_FORWARD";
BACKWARD 			= "BACKWARD";
STRAIGHT_BACKWARD	= "STRAIGHT_BACKWARD";
ROTATE_LEFT			= "ROTATE_LEFT";
ROTATE_RIGHT		= "ROTATE_RIGHT";
STOP 				= "NONE"

TOGGLE 				= "TOGGLE"
CAMERA_UP			= "UP"
CAMERA_DOWN			= "DOWN"
CAMERA_STOP			= "STOP"

var cmdSocket
  , context
  , eventSendSocket

var zmqServerAddress = window.location.hostname

var commandPort = 4010
  , eventPort = 4020
  , videoRecvPort = 4002

var cameraOn = true
  , debug = false

var fpsCount = 0
  , lastFPSTime = 0

var speed = 100;

straightForward = function() {
	var speed = -1
	sendDriveCommand(STRAIGHT_FORWARD, speed, 0);
}

var driving = false
var lastDriveTime = 0;
forward = function(angle) {
	// var speed = -1
	sendDriveCommand(FORWARD, speed, angle);
}

straightBackward = function() {
	// var speed = -1
	sendDriveCommand(STRAIGHT_BACKWARD, speed, 0);
}

backward = function(angle) {
	// var speed = -1
	sendDriveCommand(BACKWARD, speed, angle);
}

left = function() {
	var speed = 80
	sendDriveCommand(ROTATE_LEFT, speed, 0);
}

right = function() {
	var speed = 80
	sendDriveCommand(ROTATE_RIGHT, speed, 0);
}

stop = function() {
	driving = false;
	// var speed = -1
	sendDriveCommand(STOP, speed, 0);
}

toggle = function() {
	sendCameraCommand(TOGGLE);
}

var cameraMoving = false;
var lastCameraTime = 0;
cameraUp = function() {
	sendCameraCommand(CAMERA_UP);
}

cameraStop = function() {
	cameraMoving = false;
	sendCameraCommand(CAMERA_STOP);
}

cameraDown = function() {
	sendCameraCommand(CAMERA_DOWN);
}

setCameraOn = function(on) {
	cameraOn = on;
	console.log("camera", cameraOn ? "on" : "off");
}

onVideoMessage = function(msg) {
	console.log("recv");
	try {
		if (Array.isArray(msg) && msg.length == 3) {
			// console.log("target:", msg[0], "header:", msg[1], "data:", msg[2]);

			target = msg[0];
			// header = JSON.parse(msg[1]);
			rotation = msg[1];
			// console.log("rotation: ", rotation);
			data = msg[2];

			// var rotation = header.rotation;
			if (rotation != g_rotation) {
				g_rotation = rotation;
				setTransform();
			}

			if (cameraOn) {
				$("#image").attr('src', 'data:image/jpg;base64,'+data);
			}

			if (debug) {
				fpsCount++;
				var now = getTime();
				if ((now - lastFPSTime) >= 1000) {
					$('#fps').text('FPS: ' + fpsCount);
					lastFPSTime = now;
					fpsCount = 0;
				}
			}

		}
	} catch(err) {
		console.log('onVideoMessage:', err);
	}
}

var g_rotation = 0.0;
getRotationAttr = function() {
	return 'rotate(' + g_rotation + 'deg)';
}

getTranslationAttr = function() {
	var translation;
	var offset = parseInt(($('#image').width() - $('#image').height()));
	console.log('offset', offset);
	if ((g_rotation == 270) || (g_rotation == -90)) {
		translation = parseInt(-1 * Number(offset));
	} else {
		translation = 0;
	}
	return 'translate(' + translation + 'px, 0px)';
}

setTransform = function() {
	rotation = getRotationAttr();
	translation = getTranslationAttr();
	rotTrans = rotation + ' ' + translation;
	// rotTrans = rotation;
	console.log(rotTrans);
	$('#frame').attr('style', 
		'transform-origin: 50% 50%; ' +
		'-moz-transform: ' + rotTrans + '; ' +
  		'-o-transform: ' + rotTrans + '; ' +
  		'transform: ' + rotTrans + '; ' +
		'-webkit-transform: ' + rotTrans + ';')
	
	var height = $('#image').outerHeight(false);
	var width = $('#image').outerWidth(false);

	console.log("height", height, "width", width);

	var videoDivStyle = document.getElementById('video').style;
	if (g_rotation % 180 == 0) {
		videoDivStyle.height = height+'px'; 
		videoDivStyle.width = width+'px'; 
	} else {
		videoDivStyle.height = width+'px'; 
		videoDivStyle.width = height+'px'; 
	}
}

var lastCameraCommand = CAMERA_STOP
sendCameraCommand = function(command) {
	lastCameraTime = getTime();
	if (!cameraMoving || (lastCameraCommand != command)) {
		lastCameraCommand = command;
		cameraMoving = true;
		// clientCreated();
		var message = JSON.stringify({
			header: {
				id: 172,
				tid: 0,
				timestamp: getTime(),
				robot_id: "Romo",
				version: "0.1"
			},
			data: {
				type: command
			}
		});
		cmdSocket.send(['', message]);
		console.log("sent: " + message);
		// clientSent();

		checkCameraTimeout(command);
	}
}

var TIMEOUT = 500
checkDrivingTimeout = function(command) {
	if (command != STOP) {
		setTimeout(function() {
			if (getTime() - lastDriveTime > TIMEOUT) {
				if (lastDriveCommand != STOP) {
					console.log("drive timeout")
					stop();
				}
			} else {
				checkDrivingTimeout(command);
			}
		}, TIMEOUT);
	}
}

checkCameraTimeout = function(command) {
	if (command != CAMERA_STOP) {
		setTimeout(function() {
			if (getTime() - lastCameraTime > TIMEOUT) {
				if (lastCameraCommand != CAMERA_STOP) {
					cameraStop();
				}
			} else {
				checkCameraTimeout(command);
			}
		}, TIMEOUT);
	}
}

var lastDriveCommand = STOP
sendDriveCommand = function(command, speed, angle) {
	lastDriveTime = getTime();
	// if (!driving || (lastDriveCommand != command)) {
		lastDriveCommand = command;
		driving = true
		// clientCreated();
		var message = JSON.stringify({
			header: {
				id: 171,
				tid: 0,
				timestamp: getTime(),
				robot_id: "Romo",
				version: "0.1"
			},
			data: {
				move: command,
				speed: speed,
				radius: angle
			}
		});
		cmdSocket.send(['', message]);
		console.log("sent: " + message);
		// clientSent();

		checkDrivingTimeout(command);
	// }
}

getTime = function() {
	return new Date().getTime();
}

getSyncedTime = function() {
	var now = getTime();
	return parseInt(now + timestampDelta);
	// return new Date().getTime();
}

clientCreated = function() {
	var now = getTime();
	sendEvent("robot", "clientCreated", now);
}

clientSent = function() {
	var now = new Date().getTime();
	sendEvent("robot", "clientSent", now);
}

clientRecv = function() {
	var now = getSyncedTime();
	sendEvent("robot", "clientRecv", now);
}

clientDone = function() {
	var now = getSyncedTime();
	sendEvent("robot", "clientDone", now);
}

sendEvent = function(target, eventName, data) {
	var event = {
		target: target,
		sender: 'client',
		event: eventName,
		data: data
	}
	var eventJson = JSON.stringify(event);
	eventSendSocket.send([eventJson]);
	console.log("event sent", eventJson);
}

var t0, t1, t2, t3
var timestampDelta = 0

onEventRecv = function(data) {
	try {
		console.log("event received", data.toString());

		now = Number(new Date().getTime());

		jsonEvent = JSON.parse(data);

		if (jsonEvent.target == 'client') {
			if (jsonEvent.event == 'sync_req') {
				t1 = Number(jsonEvent.data);
			} else if (jsonEvent.event == 'sync_rep') {
				t2 = Number(jsonEvent.data);
				t3 = now;
				timestampDelta = parseInt(((t1 - t0) + (t2 - t3)) / 2.0);
				console.log("timestampDelta", timestampDelta);
			}
		}
	} catch(err) {
		console.log('onEventRecv:', err);
	}
}

sendSyncRequest = function() {
	t0 = Number(new Date().getTime());
	sendEvent('server', 'sync_req', t0);
}

setDebug = function(val) {
	debug = val;
	if (!debug) {
		$('#fps').text('');
	}
}

// incSpeed = function() {
// 	speed += 10;
// 	if (speed > 100) {
// 		speed = 100;
// 	}
// 	$('#speed').text(speed + '%');
// }

// decSpeed = function() {
// 	speed -= 10;
// 	if (speed < 10) {
// 		speed = 10
// 	}
// 	$('#speed').text(speed + '%');
// }

$(function(){
	ctxAddress = 'ws://' + window.location.hostname + ':9000';
	context = new zmq.Context(ctxAddress);

	cmdSocket = context.Socket(zmq.PUSH);
	var cmdAddress = 'tcp://' + zmqServerAddress + ':' + commandPort;
	cmdSocket.connect(cmdAddress);
	console.log("connect cmd to " + cmdAddress);

	var videoSocket = context.Socket(zmq.SUB);
	var videoAddress = 'tcp://' + zmqServerAddress + ':' + Number(videoRecvPort);
	// videoSocket.setsockopt(nullmq.SUBSCRIBE, '');
	videoSocket.connect(videoAddress);
	console.log("connect video to " + videoAddress);
	videoSocket.onMessage = onVideoMessage;

	var eventRecvSocket = context.Socket(zmq.SUB);
	var eventRecvAddress = 'tcp://' + zmqServerAddress + ':' + Number(eventPort+1);
	eventRecvSocket.connect(eventRecvAddress);
	console.log("connect event recv to " + eventRecvAddress);

	eventSendSocket = context.Socket(zmq.PUSH);
	var eventSendAddress = 'tcp://' + zmqServerAddress + ':' + eventPort;
	eventSendSocket.connect(eventSendAddress);
	console.log("connect event send to " + eventSendAddress);

	eventRecvSocket.onMessage = onEventRecv;

	sendSyncRequest();

	// $('#speed').text(speed + '%');

	$(document).keydown(function(event) {
		if (debug) {
			console.log("keydown", event.which);
		}

		switch(event.which) {
			case 37:  // arrow left
				break;
			case 100: // keypad: 4
				left();
				break;
			case 39:  // arrow right
				break;
			case 102: // keypad: 6
				right();
				break;
			case 103: // keypad: 7
				forward(80);
				break;
			case 105: // keypad: 9
				forward(-80);
				break;
			case 104: // keypad: 8
				straightForward();
				break;
			case 97: // keypad: 1
				backward(80);
				break;
			case 99: // keypad: 3
				backward(-80);
				break;
			case 87:  // w
			case 38:  // arrow up
				cameraUp();
				break;
			case 83:  // s
			case 40: // arrow down
				cameraDown();
				break;
			case 98: // keypad: 2
				straightBackward();
				break;
			case 32:  // space
			case 101: // keypad: 5
				stop();
				break;
			case 68: // d
				setDebug(!debug);
				break;
			case 109: // keypad: -
				decSpeed();
				break;
			case 107: // keypad: +
				incSpeed();
				break;
			case 106: // keypad: *
				break;
		}
	})
});
