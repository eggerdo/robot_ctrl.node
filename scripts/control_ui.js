
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

	initZmq();

	videoSocket.onMessage = onVideoMessage;
	
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