
var frame_rate = 5;

var current_move = STOP;
var hand_detected = false;
var initialized = false;

var MAX_Z_TRANS = 150.0;
var THRESH_Z_TRANS = 30.0;
var THRESH_X_TRANS = 30.0;
var MAX_X_TRANS = 150.0;

var MAX_Z_ROT = 0.5;
var THRESH_Z_ROT = 0.25;
var MAX_X_ROT = 0.6;
var THRESH_X_ROT = 0.25;

var MAX_SPEED = 100.0; // in %
var MIN_SPEED = 80.0;

var MAX_ANGLE = 90.0; // in deg
var MIN_ANGLE = 80.0;

var rotationalCommand = true;

var origin_x, origin_y, origin_z;

var controller = new Leap.Controller({enableGestures: false});
controller.loop(function(obj) {

});

decodeLeap = function(obj) {
	var pointables = obj.pointables.map(function(d) {
		return {
			id: d.id,
			handId: d.handId,
			length: d.length,
			directionX: d.direction[0],
			directionY: d.direction[1],
			directionZ: d.direction[2],
			tipPositionX: d.tipPosition[0],
			tipPositionY: d.tipPosition[1],
			tipPositionZ: d.tipPosition[2],
			tipVelocityX: d.tipVelocity[0],
			tipVelocityY: d.tipVelocity[1],
			tipVelocityZ: d.tipVelocity[2]
		}
	});

	var hands = obj.hands.map(function(d) {
		return {
			id: d.id,
			length: d.length,
			directionX: d.direction[0],
			directionY: d.direction[1],
			directionZ: d.direction[2],
			palmNormalX: d.palmNormal[0],
			palmNormalY: d.palmNormal[1],
			palmNormalZ: d.palmNormal[2],
			palmPositionX: d.palmPosition[0],
			palmPositionY: d.palmPosition[1],
			palmPositionZ: d.palmPosition[2],
			palmVelocityX: d.palmVelocity[0],
			palmVelocityY: d.palmVelocity[1],
			palmVelocityZ: d.palmVelocity[2],
			sphereCenterX: d.sphereCenter[0],
			sphereCenterY: d.sphereCenter[1],
			sphereCenterZ: d.sphereCenter[2],
			sphereRadius: d.sphereRadius
		}
	});

	handleLeap(hands, pointables);
}

thread = function() {
	var frame = controller.frame();
	decodeLeap(frame);
}
setInterval(thread, 1000 / frame_rate);


drive = function(command, speed, angle) {
	if (command == STOP && current_move != STOP) {
		stop();
	} else {
		sendDriveCommand(command, speed, angle);
	}

	$('#move').text(current_move);
	$('#speed').text(speed.toFixed(2) + ' %');
	$('#angle').text(angle.toFixed(2));

	current_move = command;
}

handleLeap = function(hands, pointables, gestures) {

	if (hands.length != 1) {
		if (pointables.length < 1) {
			if (initialized) {
				console.log("hand tracking stopped");
				drive(STOP, 0, 0);
				onTrackingStop();
			} else if (hand_detected) {
				hand_detected = false;
				console.log("hand lost");
				onReady();
			}
		}
		// console.log("no hand detected");
		return;
	}

	if (!hand_detected) {
		console.log("got hand, hurray, now spread your fingers");

		onInitializeStart();
		// $('#leapStatus').text('Initializing');
		// $('#leapStatus').css("color", "green");
		// $('#leapStatus').css("text-decoration", "blink");

		// hand_detected = true;
		// initialized = false;
	}

	if (!initialized) {
		if (pointables.length >= 3) {
			console.log("hand tracking started");
			onInitialized();

			initialize(hands[0]);
		} else {
			// console.log(pointables.length, " finger");
		}
	} else {
		if (pointables.length == 0) {
			if (hands.length == 0) {
				console.log("hand tracking stopped");
				onTrackingStop();
			} else {
				console.log("re-initializing");
				onInitializeStart();
			}
		}
	}

	if (initialized) {
		if (rotationalCommand) {
			executeRotationalControl(hands[0]);
		} else {
			executeTranslationalControl(hands[0]);
		}
	}

}

onReady = function() {
	$('#leapStatus').text('Waiting');
	$('#leapStatus').css("text-decoration", "none");
	$('#leapStatus').css("color", "black");
}

onInitialized = function() {
	$('#leapStatus').text('OK');
	$('#leapStatus').css("text-decoration", "none");
	$('#leapStatus').css("color", "green");
}

onTrackingStop = function() {
	initialized = false;
	hand_detected = false;
	drive(STOP, 0, 0);

	$('#leapStatus').text('Stopped');
	$('#leapStatus').css("text-decoration", "blink");
	$('#leapStatus').css("color", "red");
}

onInitializeStart = function() {
	hand_detected = true;
	initialized = false;
	drive(STOP, 0, 0);

	$('#leapStatus').text('Initializing');
	$('#leapStatus').css("text-decoration", "blink");
	$('#leapStatus').css("color", "green");
}

$(document).ready(function() {
	console.log('ready');
	$(':checkbox').iphoneStyle({
		checkedLabel: 'Rotational',
		uncheckedLabel: 'Translational',
		onChange: function(elem, value) {
			rotationalCommand = value;
			initialized = false;
		}
	});
	console.log('ready');
});

initialize = function(hands) {
	if (!rotationalCommand) {
		origin_x = hands.palmPositionX;
		origin_y = hands.palmPositionY;
		origin_z = hands.palmPositionZ;

		console.log("initialize (", origin_x, ",", origin_y, ",", origin_z, ")");
	}
	initialized = true;
}


// x -> left / right
// z -> fwd / bwd
// y -> up / down

executeRotationalControl = function(hands) {
	console.log("executeRotationalControl");

	var dx = 0, dz = 0;
	var dx_abs, dz_abs;
	var angle = 0, speed = 0;
	var angle_direction = 0;

	// x is the direction used for angle
	dx = hands.palmNormalX;
	dx_abs = Math.abs(dx);
	if (dx_abs > THRESH_X_ROT) {
		// calculate the precental offset between threshold and max
		var rot_perc = (dx_abs - THRESH_X_ROT) / (MAX_X_ROT - THRESH_X_ROT);

		// translate the precentage to the angle which is sent to the robot
		angle = MIN_ANGLE + rot_perc * (MAX_ANGLE - MIN_ANGLE);

		// make sure the angle doesn't exceed the maximum
		angle = Math.min(angle, MAX_ANGLE);

		angle_direction = dx < 0 ? 1 : -1;
	}

	// z is the direction used for translation
	dz = hands.palmNormalZ;
	dz_abs = Math.abs(dz);
	if (dz_abs > THRESH_Z_ROT) {
		// calculate the percental offset between threshold and max
		var speed_perc = (dz_abs - THRESH_Z_ROT) / (MAX_Z_ROT - THRESH_Z_ROT);

		// translate the percentage to the speed which is sent to the robot
		speed = MIN_SPEED + speed_perc * (MAX_SPEED - MIN_SPEED);

		// make sure the speed doesn't exceed the maximum
		speed = Math.min(speed, MAX_SPEED);
	}

	console.log("dx: ", dx, ", dz: ", dz);
	console.log("speed: ", speed, ", angle: ", angle);

	// speed contains the absolute speed value
	if (speed != 0) {
		// in order to determine the direction, the sign of the translational variable dz is used
		if (dz > 0) {
			drive(FORWARD, speed, angle_direction * angle);
			return;
		} else if (dz < 0) {
			drive(BACKWARD, speed, angle_direction * angle);
			return;
		}
	} else {
		// same for angle which holds the absolute value
		if (angle > 0) {
			// direction of the angle is obtained from the angleal variable dx
			if (dx < 0) {
				drive(ROTATE_RIGHT, angle, 0);
				return;
			} else if (dx > 0) {
				drive(ROTATE_LEFT, angle, 0);
				return;
			}
		}
	}

	console.log("stopping");

	// might not be neccessary
	if (current_move != STOP) {
		current_move = STOP;
		drive(STOP, 0, 0);
	}
}

executeTranslationalControl = function(hands) {
	console.log("executeTranslationalControl");

	var dx = 0, dz = 0;
	var dx_abs, dz_abs;
	var angle = 0, speed = 0;
	var angle_direction = 0;

	// x is the direction used for angle
	dx = hands.palmPositionX - origin_x;
	dx_abs = Math.abs(dx);
	if (dx_abs > THRESH_X_TRANS) {
		// calculate the precental offset between threshold and max
		var rot_perc = (dx_abs - THRESH_X_TRANS) / (MAX_X_TRANS - THRESH_X_TRANS);

		// translate the precentage to the angle which is sent to the robot
		angle = MIN_ANGLE + rot_perc * (MAX_ANGLE - MIN_ANGLE);

		// make sure the angle doesn't exceed the maximum
		angle = Math.min(angle, MAX_ANGLE);

		angle_direction = dx < 0 ? 1 : -1;
	}

	// z is the direction used for translation
	dz = hands.palmPositionZ - origin_z;
	dz_abs = Math.abs(dz);
	if (dz_abs > THRESH_Z_TRANS) {
		// calculate the percental offset between threshold and max
		var speed_perc = (dz_abs - THRESH_Z_TRANS) / (MAX_Z_TRANS - THRESH_Z_TRANS);

		// translate the percentage to the speed which is sent to the robot
		speed = MIN_SPEED + speed_perc * (MAX_SPEED - MIN_SPEED);

		// make sure the speed doesn't exceed the maximum
		speed = Math.min(speed, MAX_SPEED);
	}

	console.log("dx: ", dx, ", dz: ", dz);
	console.log("speed: ", speed, ", angle: ", angle);

	// speed contains the absolute speed value
	if (speed != 0) {
		// in order to determine the direction, the sign of the translational variable dz is used
		if (dz < 0) {
			drive(FORWARD, speed, angle_direction * angle);
			return;
		} else if (dz > 0) {
			drive(BACKWARD, speed, angle_direction * angle);
			return;
		}
	} else {
		// same for angle which holds the absolute value
		if (angle > 0) {
			// direction of the angle is obtained from the angleal variable dx
			if (dx > 0) {
				drive(ROTATE_RIGHT, angle, 0);
				return;
			} else if (dx < 0) {
				drive(ROTATE_LEFT, angle, 0);
				return;
			}
		}
	}

	console.log("stopping");

	// might not be neccessary
	if (current_move != STOP) {
		current_move = STOP;
		drive(STOP, 0, 0);
	}
}
