$(function(){
	initZmq();

	videoSocket.onMessage = onVideoMessage;

	$(':checkbox').iphoneStyle({
		checkedLabel: 'Rotational',
		uncheckedLabel: 'Translational',
		onChange: function(elem, value) {
			mRotationControl = value;
			onHandLost();
		}
	});

	mListener.onDrive = function(move, speed, angle) {
		$('#move').text(move);
		$('#speed').text(speed.toFixed(2) + ' %');
		$('#angle').text(angle.toFixed(2));
	}
	mListener.onHandLost = function() {
		$('#leapStatus').text('Waiting');
		$('#leapStatus').css("text-decoration", "none");
		$('#leapStatus').css("color", "black");
	}
	mListener.onHandDetect = function() {
		$('#leapStatus').text('Initializing');
		$('#leapStatus').css("text-decoration", "blink");
		$('#leapStatus').css("color", "green");
	}
	mListener.onTrackingStart = function() {
		$('#leapStatus').text('OK');
		$('#leapStatus').css("text-decoration", "none");
		$('#leapStatus').css("color", "green");
	}
	mListener.onTrackingStop = function() {
		$('#leapStatus').text('Stopped');
		$('#leapStatus').css("text-decoration", "blink");
		$('#leapStatus').css("color", "red");
	}
});