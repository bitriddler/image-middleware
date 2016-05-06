var statusCode =
{
	NoCode: 0,
	Success: 200,
	SecretKeyError: 999,
	TokenError: 401,
	AWSInternalServer: 500,
	ImageS3InternalServer: 500,
	NullOrEmptyParameter: 401,
	StreamingError: 402,
	ImageReadingError: 403,
	ImageResizingError: 403,
	ImageConfigurationError: 403,
	NotFound: 404
}

module.exports = statusCode;