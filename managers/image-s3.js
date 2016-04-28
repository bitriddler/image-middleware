// Load the needed modules for Node.js
var AWS = require('aws-sdk'),
fs = require('fs'),
Jimp = require("jimp"),

errCode = require("../enums/errCode"),
error = require("../models/error");

var errMsg = {
	Bucket : 'Bucket name cannot be null or empty.',
	Key: 'Image key cannot be null or empty.',
	Body: 'Object body cannot be null or empty.',
	ImgName: 'Image name cannot be null or empty.',
	ImgRelPath: 'Image relative path cannot be null or empty.',
	TempImgPath: 'Temporary image path cannot be null or empty.'
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
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			var bucketsList = [];
			for (var index in data.Buckets) {
				var bucket = data.Buckets[index];
				bucketsList.push({'name': bucket.Name, 'creation_date': bucket.CreationDate});
			}
			cb(null, bucketsList);
		});
	},

	listObjects: function(bucket, cb) {
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		s3.listObjects({ Bucket: bucket}, function(err, data) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, data);  
		});
	},

	createBucket: function(bucket, cb) {
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		s3.createBucket({Bucket: bucket}, function(err) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, "'" + bucket + "' bucket has been created successfully!");  
		});
	},

	createObject: function(bucket, key, body, cb){
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		if(!key) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Key), null);
		}
		if(!body) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Body), null);
		}
		//Overwrite the existed key (if exists)
		s3.upload({ Bucket: bucket, Key: key, Body: body}, function(err, data) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, "'" + key + "' object in '" + bucket + "' bucket has been created successfully!");  
		});
	},

	deleteBucket: function(bucket, cb){
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		s3.deleteBucket({ Bucket: bucket }, function(err) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, "'" + bucket + "' bucket is successfully deleted!");
		});
	},

	deleteObject: function(bucket, key, cb){
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		if(!key) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Key), null);
		}
		s3.deleteObject({ Bucket: bucket, Key: key }, function(err) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, "'" + key + "' key from '" + bucket + "' bucket is successfully deleted!");
		});
	},

	getImage: function(bucket, key, cb) {
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		if(!key) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Key), null);
		}
		s3.getObject({ Bucket: bucket, Key: key }, function(err, data) {
			if (err) {
				return cb(new error(errCode.AWSInternalServer, err), null);
			}
			cb(null, data.Body);
		});
	},

	postImage: function(bucket, imgName, imgRelPath, tempImgPathOnDisk, resizeImgConfig, cb) {
		if(!bucket) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.Bucket), null);
		}
		if(!imgName) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.ImgName), null);
		}
		if(!imgRelPath) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.ImgRelPath), null);
		}
		if(!tempImgPathOnDisk) {
			return cb(new error(errCode.NullOrEmptyParameter, errMsg.TempImgPath), null);
		}
		var len = resizeImgConfig.length;
		if(len==0){
			return cb(new error(errCode.ImageConfigurationError, err), null);
		}
		var keys = [];
		var ctr = 0;
		streamImage(tempImgPathOnDisk);
		function streamImage(path) {
			Jimp.read(path, resizeImage);
		}
		function resizeImage(err, img) {
			if (err) {
				return cb(new error(errCode.ImageReadingError, err), null);
			}//ORIGINAL: If no w and h is set, then no resizing

			if(resizeImgConfig[ctr].width || resizeImgConfig[ctr].height){
				var w = resizeImgConfig[ctr].width || Jimp.AUTO;
				var h = resizeImgConfig[ctr].height || Jimp.AUTO;
				img.resize(w,h);
			}
			img.getBuffer(Jimp.MIME_JPEG, getBufferImage);
		}
		function getBufferImage(err, buffer) {
			if (err) {
				return cb(new error(errCode.ImageResizingError, err), null);
			}
			uploadImage(buffer);
		}
		function uploadImage(buffer){
			var prefix = resizeImgConfig[ctr].prefix || '';
			var key = imgRelPath + prefix + imgName;
			s3.putObject({ Bucket: bucket, Key: key, Body: buffer }, function (err) {
				if (err) {
					return cb(new error(errCode.AWSInternalServer, err), null);
				}
				ctr++;
				keys.push(key);
				if(ctr<len) {
					streamImage(tempImgPathOnDisk);
				}
				else {
					cb(null, keys);
				}
			});
		}
	}
}
