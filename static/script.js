STRAIGHT_FORWARD	= "STRAIGHT_FORWARD";
STRAIGHT_BACKWARD	= "STRAIGHT_BACKWARD";
ROTATE_LEFT			= "ROTATE_LEFT";
ROTATE_RIGHT		= "ROTATE_RIGHT";
STOP 				= "NONE"

TOGGLE 				= "TOGGLE"

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

forward = function() {
	var speed = -1
	sendDriveCommand(STRAIGHT_FORWARD, speed);
}

backward = function() {
	var speed = -1
	sendDriveCommand(STRAIGHT_BACKWARD, speed);
}

left = function() {
	var speed = 50
	sendDriveCommand(ROTATE_LEFT, speed);
}

right = function() {
	var speed = 50
	sendDriveCommand(ROTATE_RIGHT, speed);
}

stop = function() {
	var speed = -1
	sendDriveCommand(STOP, speed);
}

toggle = function() {
	sendCameraCommand(TOGGLE);
}

setCameraOn = function(on) {
	cameraOn = on;
	console.log("camera", cameraOn ? "on" : "off");
}

onVideoMessage = function(msg) {
	try {
		if (Array.isArray(msg) && msg.length == 3) {
			// console.log("target:", msg[0], "header:", msg[1], "data:", msg[2]);

			target = msg[0];
			header = JSON.parse(msg[1]);
			data = msg[2];

			var rotation = header.rotation;
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

sendCameraCommand = function(command) {
	clientCreated();
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
	clientSent();
}

sendDriveCommand = function(command, speed) {
	clientCreated();
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
			radius: 0
		}
	});
	cmdSocket.send(['', message]);
	console.log("sent: " + message);
	clientSent();
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

	$(document).keydown(function(event) {
		if (debug) {
			console.log("keydown", event.which);
		}

		switch(event.which) {
			case 37: 
				left();
				break;
			case 39:
				right();
				break;
			case 38:
				forward();
				break;
			case 40:
				backward();
				break;
			case 32:
				stop();
				break;
			case 68:
				setDebug(!debug);
				break;
		}
	})
});
