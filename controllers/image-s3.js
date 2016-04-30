//Load the needed modules
var s3 = require('../managers/image-s3');
var formidable = require('formidable');
var resizeConfigiurations = require('../config/resize-config.json');
var resizeImgConfigText = 'resize-img-config';

function getResizeConfig(type) {
	if(resizeConfigiurations[type]) {
		return resizeConfigiurations[type];
	}

	return resizeConfigiurations['default'];
}

module.exports = function(app) {

	//List all buckets in S3 account
	app.get('/list-buckets', function (req, res){
		s3.listBuckets(function(err, bucketsList){
			if(err) res.send(err);
			else{
				res.json(bucketsList);
			}
		});
	});

	//List all objects in a bucket
	app.get('/list-objects/:bucket', function (req, res){
		s3.listObjects(req.params.bucket, function(err, objectsList){
			if(err) res.send(err);
			else{
				res.json(objectsList);
			}
		});
	});

	//Create bucket by name
	app.get('/create-bucket', function (req, res){
		s3.createBucket(req.query.bucket, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Create object by bucket name and key
	app.get('/create-object', function (req, res){
		s3.createObject(req.query.bucket, req.query.key, req.query.bodycontent, function(err, msg){
			if(err) res.send(err);
			else{
				res.end(msg);
			}
		});
	});

	//Delete bucket by name
	app.get('/delete-bucket', function (req, res){
		s3.deleteBucket(req.query.bucket, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Delete object from bucket by bucket name and key
	app.get('/delete-object', function (req, res){
		s3.deleteObject(req.query.bucket, req.query.key, function(err, msg){
			if(err) res.send(err);
			else{
				res.send(msg);
			}
		});
	});

	//Get image by key
	app.get('/get-image', function (req, res){
		s3.getImage(req.query.bucket, req.query.key, function(err, image){
			if(err) res.send(err);
			else{
				res.writeHead(200, {'Content-Type': 'image/jpg' });
				res.end(image, 'binary');
			}
		});
	});

	//Post image to S3
	app.post('/post-image', function (req, res, next){
		var resizeImgConfigHdr = req.header(resizeImgConfigText);
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
					function(err, images){
						if(err) {
							next(err);
						} else {
							res.json(images);
						}
					});
			}
		});
	});
}