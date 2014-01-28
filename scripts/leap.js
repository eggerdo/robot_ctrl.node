/**
 * Author: D. Egger
 * Copyright: Distributed Organisms B.V.
 * Date: Aug. 8, 2013
 */

 // DEFINITIONS
MAX_Z_TRANS 	= 150.0;
THRESH_Z_TRANS 	= 30.0;
THRESH_X_TRANS 	= 30.0;
MAX_X_TRANS 	= 150.0;

MAX_Z_ROT 		= 0.5;
THRESH_Z_ROT 	= 0.25;
MAX_X_ROT 		= 0.6;
THRESH_X_ROT 	= 0.25;

MAX_SPEED 		= 100.0; // in %
MIN_SPEED 		= 80.0;

MAX_ANGLE 		= 90.0; // in deg
MIN_ANGLE 		= 80.0;

// LEAP
// TODO: if this file should be used standalone in a nodejs node then
// 	 uncomment the following line. if it is used in a browser, use
// 	 instead 
// 	 <script type="text/javascript" src="//js.leapmotion.com/0.2.0-beta1/leap.min.js"></script>
// 	 in the html
// var Leap = require('leapjs');

// we poll the controller in order to achieve the desired
// frame rate. using the loop of the controller would be way
// to fast.
var controller = new Leap.Controller({enableGestures: false});
controller.on('connect', function() {
	console.log("leap ready...");
});
controller.connect();

// CONTROL
var mFrameRate = 5;

var mCurrentMove = STOP;
var mHandDetected = false;
var mTracking = false;

// Listener with methods that can be assigned to listen for 
// events, e.g. to update the user interface
var mListener = {
	// onDrive = function(move, speed, angle)
	//		called when a drive command is issued
	// onHandLost = function()
	//		called when the hand is lost
	// onHandDetect = function()
	//		called when a hand is detected
	// onTrackingStart = function()
	//		called when movement tracking is started
	// onTrackingStop = function()
	//		called when movement tracking is stopped
};

// mRotationControl = true, controls with rotation of hand. pitch -> fwd/bwd, roll -> left/right
// mRotationControl = false, controls with translation of hand. fwd/bwd, left/right (like moving a joystick)
var mRotationControl = true;

var mOriginX, mOriginY, mOriginZ;

// decodes the object received from the leap controller into hands and pointables with variables
// to simplify access
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

// the polling thread. runs with the defined frame rate
// and polls the controller for the most recent frame
setInterval(function() {
	var frame = controller.frame();
	decodeLeap(frame);
}, 1000 / mFrameRate);

// encapsulate the drive function to prevent the stop
// command from being sent all the time.
handleDriveCommand = function(command, speed, angle) {
	if (command == STOP && mCurrentMove != STOP) {
		stop();
	} else {
		sendDriveCommand(command, speed, angle);
	}

	if (mListener.onDrive) {
		mListener.onDrive(mCurrentMove, speed, angle);
	}

	mCurrentMove = command;
}

// uses pointables and hands to transform hand movements into
// handleDriveCommand commands
handleLeap = function(hands, pointables) {

	// sometimes a hand is lost, but the fingers are still detected
	// ignore the loss of a hand as long as we detect the fingers still
	if ((hands.length == 0) && (pointables.length < 1)) {
		// if it was detected before
		if (mHandDetected) {
			onHandLost();
		}
		// no hand detected yet
		return;
	} if (hands.length > 1) {
		console.log("PANIC! too many hands");
		return;
	}

	// this point is only reached if a hand is detected, or tracking is 
	// already in progress

	// hand wasn't detected yet
	if (!mHandDetected) {
		onHandDetect();
	}

	// if not tracking yet
	if (!mTracking) {
		// wait for fingers to be spread, meaning at least 3 fingers must be
		// detected
		if (pointables.length >= 3) {
			console.log("hand tracking started");
			initialize(hands[0]);
			onTrackingStart();
		} else {
			// console.log(pointables.length, " finger");
		}
	} else {
		if (pointables.length == 0) {
			// hand is detected, but no fingers are found
			// use this event to stop
			onTrackingStop();
		}
	}

	if (mTracking) {
		if (mRotationControl) {
			executeRotationalControl(hands[0]);
		} else {
			executeTranslationalControl(hands[0]);
		}
	}

}

// called when the hand was lost
onHandLost = function() {
	console.log("hand lost");
	mHandDetected = false;
	mTracking = false;

	if (mListener.onHandLost) {
		mListener.onHandLost();
	}
}

onHandDetect = function() {
	console.log("hand detected, hurray, now spread your fingers...");
	mHandDetected = true;
	mTracking = false;

	if (mListener.onHandDetect) {
		mListener.onHandDetect();
	}
}

// called when the tracking is started (hand detected and
// fingers spread)
onTrackingStart = function() {
	console.log("start tracking...");
	mTracking = true;

	if (mListener.onTrackingStart) {
		mListener.onTrackingStart();
	}
}

onTrackingStop = function() {
	console.log("stop tracking");
	mTracking = false;
	// send stop command
	handleDriveCommand(STOP, 0, 0);

	if (mListener.onTrackingStop) {
		mListener.onTrackingStop();
	}
}

// for translational control, use the current position as the origin
// for rotational control, nothing needs to be done
initialize = function(hands) {
	if (!mRotationControl) {
		mOriginX = hands.palmPositionX;
		mOriginY = hands.palmPositionY;
		mOriginZ = hands.palmPositionZ;

		console.log("initialize (", mOriginX, ",", mOriginY, ",", mOriginZ, ")");
	}
}


// x -> left / right hand movment
// z -> fwd / bwd hand movment
// y -> up / down hand movment
executeRotationalControl = function(hands) {
	// console.log("executeRotationalControl");

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

		angle_direction = dx > 0 ? 1 : -1;
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
			handleDriveCommand(FORWARD, speed, angle_direction * angle);
			return;
		} else if (dz < 0) {
			handleDriveCommand(BACKWARD, speed, angle_direction * angle);
			return;
		}
	} else {
		// same for angle which holds the absolute value
		if (angle > 0) {
			// direction of the angle is obtained from the angleal variable dx
			if (dx < 0) {
				handleDriveCommand(ROTATE_RIGHT, angle, 0);
				return;
			} else if (dx > 0) {
				handleDriveCommand(ROTATE_LEFT, angle, 0);
				return;
			}
		}
	}

	// console.log("stopping");

	// might not be neccessary
	if (mCurrentMove != STOP) {
		mCurrentMove = STOP;
		handleDriveCommand(STOP, 0, 0);
	}
}

executeTranslationalControl = function(hands) {
	// console.log("executeTranslationalControl");

	var dx = 0, dz = 0;
	var dx_abs, dz_abs;
	var angle = 0, speed = 0;
	var angle_direction = 0;

	// x is the direction used for angle
	dx = hands.palmPositionX - mOriginX;
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
	dz = hands.palmPositionZ - mOriginZ;
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
			handleDriveCommand(FORWARD, speed, angle_direction * angle);
			return;
		} else if (dz > 0) {
			handleDriveCommand(BACKWARD, speed, angle_direction * angle);
			return;
		}
	} else {
		// same for angle which holds the absolute value
		if (angle > 0) {
			// direction of the angle is obtained from the angleal variable dx
			if (dx > 0) {
				handleDriveCommand(ROTATE_RIGHT, angle, 0);
				return;
			} else if (dx < 0) {
				handleDriveCommand(ROTATE_LEFT, angle, 0);
				return;
			}
		}
	}

	// console.log("stopping");

	// might not be neccessary
	if (mCurrentMove != STOP) {
		mCurrentMove = STOP;
		handleDriveCommand(STOP, 0, 0);
	}
}