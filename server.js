//Load the needed modules
var express = require("express"),
app = express(),
fs  = require('fs');

//Require controllers
var controllers_path = __dirname + '/controllers'
, controller_files = fs.readdirSync(controllers_path);

controller_files.forEach(function (file) {
	require(controllers_path+'/'+file)(app);
});

//Running the server and listen to specific port
var port = process.env.PORT || 9999;
app.listen(port, function() {
	console.log('Image S3 middleware server is running and listening on port ' + port);
});