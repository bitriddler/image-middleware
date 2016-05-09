//Load the needed modules
var s3 = require('../managers/image-s3');
var formidable = require('formidable');
var resizeConfigiurations = require('../config/resize-config.json');
var statusCode = require("../enums/statusCode");

function getResizeConfig(type) {
	if(resizeConfigiurations[type]) {
		return resizeConfigiurations[type];
	}
	return resizeConfigiurations['default'];
}

module.exports = function(app) {

	//List all buckets in S3 account
	app.get('/list-buckets', function (req, res){
		s3.listBuckets(function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//List all objects in a bucket
	app.get('/list-objects/:bucket', function (req, res){
		s3.listObjects(req.params.bucket, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//Create bucket by name
	app.get('/create-bucket', function (req, res){
		s3.createBucket(req.query.bucket, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//Create object by bucket name and key
	app.get('/create-object', function (req, res){
		s3.createObject(req.query.bucket, req.query.key, req.query.bodycontent, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//Delete bucket by name
	app.get('/delete-bucket', function (req, res){
		s3.deleteBucket(req.query.bucket, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//Delete object from bucket by bucket name and key
	app.get('/delete-object', function (req, res){
		s3.deleteObject(req.query.bucket, req.query.key, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.json(response);
			}
		});
	});

	//Get image by key
	app.get('/get-image', function (req, res){
		s3.getImage(req.query.bucket, req.query.key, function(response){
			if(response.statusCode != statusCode.Success){
				res.send(response);
			}
			else{
				res.writeHead(statusCode.Success, {'Content-Type': 'image/jpg' });
				res.end(response.data, 'binary');
			}
		});
	});

	//Post image to S3
	app.post('/post-image', function (req, res, next){
		var resizeImgConfig = getResizeConfig(req.query.type);
		var form = new formidable.IncomingForm();
		form.parse(req);
		form.on('end', function(fields, files) {
			if(this.openedFiles[0].size > 2097152) {
				res.send('Image size must not exceed 2MB');
			} else {
				s3.postImage(
         req.query.bucket,
         this.openedFiles[0].type,
         this.openedFiles[0].name,
         this.openedFiles[0].path,
         resizeImgConfig,
         function(response){
         	if(response.statusCode != statusCode.Success){
         		next(response.error);
         	}
         	else{
         		res.json(response);
         	}
         });
			}
		});
	});
}		
