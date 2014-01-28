/**
 * Server that provides a web page for remote control of robots and displaying 
 * video on a web browser. It opens tcp ports to send and receive ZMQ messages
 * from the backend (robot server)
 *
 * Author: D. Egger
 * Copyright: Distributed Organisms B.V.
 * Date: Aug. 8, 2013
 */

var express	= require('express')
  , app 	= express()

app.configure(function() {
	app.use(express.static(__dirname));
	app.use(express.static(__dirname + '/html'));
	app.use(express.static(__dirname + '/scripts'));
	app.use(express.static(__dirname + '/libs'));
	app.use(express.static(__dirname + '/assets'));
})

app.listen(3000);

console.log("Serving WebPage on Port 3000");