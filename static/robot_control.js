/**
 * Provides functionality to remote control a robot. control messages are
 * sent over ZMQ to the backend (robot server). A ZMQ control message has
 * two fields:
 *   1. Target (the ID of the robot)
 *   2. Control Command
 *
 * The control command is a JSON message with a header and a data field. 
 *
 * The header field has the elements:
 *   1. ID (command type, 171 for drive, 172 for camera)
 *   2. TID (the transaction id or message number)
 *   3. Timestamp
 *   4. Robot ID (the ID of the robot, same as 1. Field in the ZMQ message)
 *   5. Version (a version numer used to identify the JSON format)
 *
 * The data field has the elements:
 *   1. Move Type (Forward, Straight Forward, Backward ...)
 *   2. Speed (Value between 0 - 100%)
 *   3. Angle (Value between -90 - +90)
 *
 * Author: D. Egger
 * Copyright: Distributed Organisms B.V.
 * Date: Aug. 8, 2013
 */

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

var driving = false
var lastDriveTime = 0;
var lastDriveCommand = STOP

var speed = 100;

var DRIVE_TIMEOUT = 500

getTime = function() {
	return new Date().getTime();
}

straightForward = function() {
	var speed = -1
	sendDriveCommand(STRAIGHT_FORWARD, speed, 0);
}

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

checkDrivingTimeout = function(command) {
	if (command != STOP) {
		setTimeout(function() {
			if (getTime() - lastDriveTime > DRIVE_TIMEOUT) {
				if (lastDriveCommand != STOP) {
					console.log("drive timeout")
					stop();
				}
			} else {
				checkDrivingTimeout(command);
			}
		}, DRIVE_TIMEOUT);
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

		checkCameraCommandTimeout(command);
	}
}

checkCameraCommandTimeout = function(command) {
	if (command != CAMERA_STOP) {
		setTimeout(function() {
			if (getTime() - lastCameraTime > DRIVE_TIMEOUT) {
				if (lastCameraCommand != CAMERA_STOP) {
					cameraStop();
				}
			} else {
				checkCameraCommandTimeout(command);
			}
		}, DRIVE_TIMEOUT);
	}
}
