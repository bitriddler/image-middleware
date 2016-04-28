var errCode =
{
	NoCode: 0,
	SecretKeyError: 999,
	AWSInternalServer: 500,
	ImageS3InternalServer: 501,
	NullOrEmptyParameter: 401,
	StreamingError: 402,
	ImageReadingError: 403,
	ImageResizingError: 403,
	ImageConfigurationError: 403,
	NotFound: 404
}

module.exports = errCode;