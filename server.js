//Load the needed modules
var express = require("express");
var app = express();
var fs  = require('fs');
var secretKeyMiddleware = require('./middlewares/secretkey-auth');
var errCode = require("./enums/errCode");
var error = require("./models/error");

//Handle default get request with welcome screen
app.get('/', function (req, res){
	res.end('Welcome to Image S3 middleware server!');
});

// Authenticate all incoming requests with secret key
app.use(secretKeyMiddleware);

//Require controllers
var controllers_path = __dirname + '/controllers'
, controller_files = fs.readdirSync(controllers_path);

controller_files.forEach(function (file) {
	require(controllers_path+'/'+file)(app);
});

//Handling Not found error (404)
app.use(function(req, res, next) {
	res.status(errCode.NotFound)
		.send(new error(errCode.NotFound, 'Sorry cant find that!')); 
});

//Handling Image S3 Internal Server (501)
app.use(function(err, req, res, next) {
	res.status(errCode.ImageS3InternalServer)
		.send(new error(errCode.ImageS3InternalServer, 'Something broke!')); 
});

//Running the server and listen to specific port
var port = process.env.PORT || 9999;
app.listen(port, function() {
	console.log('Image S3 middleware server is running and listening on port ' + port);
});