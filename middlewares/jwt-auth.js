var jwt = require('jsonwebtoken');
var validationCollection = require('../config/validation.json');
var errCode = require("../enums/errCode");
var error = require("../models/error");

var secretKey = process.env.SECRET;

var errMsg = {
	tokenInvalid : 'Authorization token is invalid.',
	tokenMissing : 'Authorization header is missing in the request headers.'
}

function decodeToken(authorizationHeader) {
	var jwtToken = authorizationHeader.replace('JWT ', '');
	return jwt.decode(jwtToken, secretKey);
}

// @Todo Check hostname with the host making the request
function validateClientId(clientId) {
	return validationCollection.some(function (obj) {
		return (obj.clientId === clientId);
	});
};

module.exports = function(req, res, next) {
	if(! req.header('Authorization')) {
		return next(new error(errCode.TokenError, errMsg.tokenMissing));
	}

	var decodedToken = decodeToken(req.header('Authorization'));

	if(! decodedToken || !decodedToken.iss) {
		return next(new error(errCode.TokenError, errMsg.tokenInvalid));
	}

	// Not a valid client
	if(!validateClientId(decodedToken.iss)) {
		return next(new error(errCode.TokenError, errMsg.tokenInvalid));
	}

	next();
}