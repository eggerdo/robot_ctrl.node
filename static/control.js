
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

incSpeed = function() {
	speed += 10;
	if (speed > 100) {
		speed = 100;
	}
	$('#speed').text('Speed: ' + speed + '%');
}

decSpeed = function() {
	speed -= 10;
	if (speed < 10) {
		speed = 10
	}
	$('#speed').text('Speed: ' + speed + '%');
}


$(function(){
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
