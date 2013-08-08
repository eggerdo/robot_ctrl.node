/**
 * Creates ZMQ channels to the backend (robot server) to receive and send ZMQ 
 * messages. Two channels (on for receiving, one for sending) each for command,
 * video and event messages
 *
 * Author: D. Egger
 * Copyright: Distributed Organisms B.V.
 * Date: Aug. 8, 2013
 */

var cmdSocket,
	context,
  	videoSocket,
	eventSendSocket,
	eventRecvSocket

var zmqServerAddress = window.location.hostname

var commandPort = 4010
  , eventPort = 4020
  , videoRecvPort = 4002

$(function(){
	ctxAddress = 'ws://' + window.location.hostname + ':9000';
	context = new zmq.Context(ctxAddress);

	cmdSocket = context.Socket(zmq.PUSH);
	var cmdAddress = 'tcp://' + zmqServerAddress + ':' + commandPort;
	cmdSocket.connect(cmdAddress);
	console.log("connect cmd to " + cmdAddress);

	videoSocket = context.Socket(zmq.SUB);
	var videoAddress = 'tcp://' + zmqServerAddress + ':' + Number(videoRecvPort);
	// videoSocket.setsockopt(nullmq.SUBSCRIBE, '');
	videoSocket.connect(videoAddress);
	console.log("connect video to " + videoAddress);

	eventRecvSocket = context.Socket(zmq.SUB);
	var eventRecvAddress = 'tcp://' + zmqServerAddress + ':' + Number(eventPort+1);
	eventRecvSocket.connect(eventRecvAddress);
	console.log("connect event recv to " + eventRecvAddress);

	eventSendSocket = context.Socket(zmq.PUSH);
	var eventSendAddress = 'tcp://' + zmqServerAddress + ':' + eventPort;
	eventSendSocket.connect(eventSendAddress);
	console.log("connect event send to " + eventSendAddress);

});