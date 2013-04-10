var express	= require('express')
  , app 	= express()

app.configure(function() {
	app.use(express.static(__dirname));
	app.use(express.static(__dirname + '/static'));
	app.use(express.static(__dirname + '/libs'));
})

app.listen(3000);

console.log("Serving WebPage on Port 3000");