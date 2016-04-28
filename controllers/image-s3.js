//Load the needed modules
var s3 = require('../managers/image-s3'),
formidable = require('formidable'),
fsx   = require('fs-extra'),

errCode = require("../enums/errCode"),
error = require("../models/error"),

validationCollection = require('../config/validation.json');

var resizeImgConfigText = 'resize-img-config';

//Secret key section
var secretKeyText = 'secret-key';
var errMsg = {
	SecretKeyInvalid : 'Secret-Key is invalid.',
	SecretKeyMissing : 'Secret-Key is missing in the request headers.'
}

module.exports = function(app) {

	//SecretKey/HostName validation on ALL incoming requests
	var validateSecretKey = function(secretKey) {
		if(!secretKey) return false;
		return validationCollection.some(function (obj) {
			return (obj.secretKey === secretKey);
		});
	};

	//Handle default get request with welcome screen
	app.get('/', function (req, res){
		res.end('Welcome to Image S3 middleware server!');
	});

	//List all buckets in S3 account
	app.get('/list-buckets', function (req, res){
		if(!req.header(secretKeyText)){ 
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){ 
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.listBuckets(function(err, bucketsList){
			if(err) res.send(err);
			else{
				res.json(bucketsList);
			}
		});
	});

	//List all objects in a bucket
	app.get('/list-objects/:bucket', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.listObjects(req.params.bucket, function(err, objectsList){
			if(err) res.send(err);
			else{
				res.json(objectsList);
			}
		});
	});

	//Create bucket by name
	app.get('/create-bucket', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.createBucket(req.query.bucket, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Create object by bucket name and key
	app.get('/create-object', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.createObject(req.query.bucket, req.query.key, req.query.bodycontent, function(err, msg){
			if(err) res.send(err);
			else{
				res.end(msg);
			}
		});
	});

	//Delete bucket by name
	app.get('/delete-bucket', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.deleteBucket(req.query.bucket, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Delete object from bucket by bucket name and key
	app.get('/delete-object', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.deleteObject(req.query.bucket, req.query.key, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Get image by key
	app.get('/get-image', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		s3.getImage(req.query.bucket, req.query.key, function(err, image){
			if(err) res.send(err);
			else{
				res.writeHead(200, {'Content-Type': 'image/jpg' });
				res.send(image, 'binary');
			}
		});
	});

	//Post image to S3
	app.post('/post-image', function (req, res){
		if(!req.header(secretKeyText)){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
		}
		if(!validateSecretKey(req.header(secretKeyText))){
			return res.send(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
		}
		var resizeImgConfigHdr = req.header(resizeImgConfigText);
		var resizeImgConfig = resizeImgConfigHdr ? JSON.parse(resizeImgConfigHdr) : require("../config/defaultResizeImg.json");
		console.log(resizeImgConfig);
		var form = new formidable.IncomingForm();
		form.parse(req);
		form.on('end', function(fields, files) {
			if(this.openedFiles[0].size > 2097152) res.send('Image size must not exceed 2MB');
			else{
				var postImgOptions = [req.query.bucket, this.openedFiles[0].name,
				req.query.imgRelPath, this.openedFiles[0].path, resizeImgConfig];
				s3.postImage(postImgOptions, function(err, keys){
					if(err) res.send(err);
					else{
						res.json(keys);
					}
				});
			}
		});
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
}