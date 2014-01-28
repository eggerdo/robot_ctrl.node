/**
 * Handles incoming video messages and displays them on the webbrowser. 
 * Video Messages arrive as an array with 3 elements:
 *   1. Target (ID of the Robot)
 *	 2. Rotation (if != 0, the frame needs to be rotated by the given
 *				  degrees to display it correctly on the screen)
 *   3. RGB Data, encoded as Base64
 *
 * Author: D. Egger
 * Copyright: Distributed Organisms B.V.
 * Date: Aug. 8, 2013
 */

var debug = false

var currentRotation = 0.0;

var fpsCount = 0
  , lastFPSTime = 0;

var cameraOn = true;

setDebug = function(val) {
	debug = val;
	if (!debug) {
		$('#fps').text('');
	}
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
			if (rotation != currentRotation) {
				currentRotation = rotation;
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

getRotationAttr = function() {
	return 'rotate(' + currentRotation + 'deg)';
}

getTranslationAttr = function() {
	var translation;
	var offset = parseInt(($('#image').width() - $('#image').height()));
	console.log('offset', offset);
	if ((currentRotation == 270) || (currentRotation == -90)) {
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
	if (currentRotation % 180 == 0) {
		videoDivStyle.height = height+'px'; 
		videoDivStyle.width = width+'px'; 
	} else {
		videoDivStyle.height = width+'px'; 
		videoDivStyle.width = height+'px'; 
	}
}
