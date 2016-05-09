// Load the needed modules for Node.js
var AWS = require('aws-sdk'),
fs = require('fs'),
Jimp = require("jimp"),

statusCode = require("../enums/statusCode"),
error = require("../models/error");
response = require("../models/response");

var errMsg = {
	Bucket : 'Bucket name cannot be null or empty.',
	Key: 'Image key cannot be null or empty.',
	Body: 'Object body cannot be null or empty.',
	ImgName: 'Image name cannot be null or empty.',
	ImgRelPath: 'Image relative path cannot be null or empty.',
	TempImgPath: 'Temporary image path cannot be null or empty.',
	ImgConfig: 'Image configuration is invalid.'
}

//Set configuration (Access, Secret, and region)
AWS.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: ''
});

//Create an instance of S3
var s3 = new AWS.S3({ endpoint :'https://s3.amazonaws.com' });

module.exports = {
	listBuckets: function(cb) {
		s3.listBuckets(function(err, data) {
			if (err){
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			var bucketsList = [];
			for (var index in data.Buckets) {
				var bucket = data.Buckets[index];
				bucketsList.push({'name': bucket.Name, 'creation_date': bucket.CreationDate});
			}
			cb(new response(statusCode.Success, null, bucketsList));
		});
	},

	listObjects: function(bucket, cb) {
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		s3.listObjects({ Bucket: bucket}, function(err, data) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, data));
		});
	},

	createBucket: function(bucket, cb) {
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		s3.createBucket({Bucket: bucket}, function(err) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, bucket));
		});
	},

	createObject: function(bucket, key, body, cb){
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		if(!key) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Key)));
		}
		if(!body) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Body)));
		}
		//Overwrite the existed key (if exists)
		s3.upload({ Bucket: bucket, Key: key, Body: body}, function(err, data) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, { Bucket: bucket, Key: key }));
		});
	},

	deleteBucket: function(bucket, cb){
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		s3.deleteBucket({ Bucket: bucket }, function(err) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, bucket));
		});
	},

	deleteObject: function(bucket, key, cb){
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		if(!key) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Key)));
		}
		s3.deleteObject({ Bucket: bucket, Key: key }, function(err) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, { Bucket: bucket, Key: key }));
		});
	},

	getImage: function(bucket, key, cb) {
		if(!bucket) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Bucket)));
		}
		if(!key) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.Key)));
		}
		s3.getObject({ Bucket: bucket, Key: key }, function(err, data) {
			if (err) {
				return cb(new response(statusCode.AWSInternalServer, new error(err)));
			}
			cb(new response(statusCode.Success, null, data.Body));
		});
	},

	postImage: function(bucket, contentType, imgName, tempImgPathOnDisk, resizeImgConfig, cb) {
		if(!bucket) {
			return cb(new error(statusCode.NullOrEmptyParameter, errMsg.Bucket));
		}
		if(!imgName) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.ImgName)));
		}
		if(!tempImgPathOnDisk) {
			return cb(new response(statusCode.NullOrEmptyParameter, new error(errMsg.TempImgPath)));
		}
		var len = resizeImgConfig.length;
		if(len==0){
			return cb(new response(statusCode.ImageConfigurationError, new error(errMsg.ImgConfig)));
		}
		var images = [];
		var ctr = 0;
		streamImage(tempImgPathOnDisk);
		function streamImage(path) {
			Jimp.read(path, resizeImage);
		}
		function resizeImage(err, img) {
			if (err) {
				return cb(new response(statusCode.ImageReadingError, new error(err)));
			}//ORIGINAL: If no w and h is set, then no resizing

			if(resizeImgConfig[ctr].width || resizeImgConfig[ctr].height){
				img.resize(
					resizeImgConfig[ctr].width || Jimp.AUTO,
					resizeImgConfig[ctr].height || Jimp.AUTO);
			}
			// @todo use the correct mime type of the image
			img.getBuffer(Jimp.MIME_JPEG, getBufferImage);
		}
		function getBufferImage(err, buffer) {
			if (err) {
				return cb(new response(statusCode.ImageResizingError, new error(err)));
			}
			uploadImage(buffer);
		}
		function uploadImage(buffer){
			var prefix = resizeImgConfig[ctr].prefix || '';
			var key = prefix + imgName;
			s3.putObject({ ContentType: contentType, Bucket: bucket, Key: key, Body: buffer }, function (err) {
				if (err) {
					return cb(new response(statusCode.AWSInternalServer, new error(err)));
				}
				images.push({
					url: `https://${bucket}.s3.amazonaws.com/${key}`,
					width: resizeImgConfig[ctr].width,
					height: resizeImgConfig[ctr].height,
					original: !resizeImgConfig[ctr].width && !resizeImgConfig[ctr].height
				});
				ctr++;
				if(ctr<len) {
					streamImage(tempImgPathOnDisk);
				}
				else {
					cb(new response(statusCode.Success, null, images));
				}
			});
		}
	}
}
