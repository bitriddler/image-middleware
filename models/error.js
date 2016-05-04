function error(code, msg, desc, type, errors) {
	this.statusCode = code || require("../enums/errCode").NoCode;
	this.error = {
		message: typeof msg === 'object' ? msg.message : msg,
		description: desc || '',
		type: type || '',
		errors: errors || null
	}
}

module.exports = error;