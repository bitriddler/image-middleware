var validationCollection = require('../config/validation.json');
var errCode = require("../enums/errCode");
var error = require("../models/error");

//Secret key section
var secretKeyText = 'secret-key';
var errMsg = {
	SecretKeyInvalid : 'Secret-Key is invalid.',
	SecretKeyMissing : 'Secret-Key is missing in the request headers.'
}

//SecretKey/HostName validation on ALL incoming requests
var validateSecretKey = function(secretKey) {
	if(!secretKey) return false;
	return validationCollection.some(function (obj) {
		return (obj.secretKey === secretKey);
	});
};

module.exports = function(req, res, next) {
	if(!req.header(secretKeyText)){ 
		next(new error(errCode.SecretKeyError, errMsg.SecretKeyMissing));
	}
	
	else if(!validateSecretKey(req.header(secretKeyText))){ 
		next(new error(errCode.SecretKeyError, errMsg.SecretKeyInvalid));
	}

	else {
		next();
	}
}