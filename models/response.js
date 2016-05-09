function response(code, err, data) {
	this.statusCode = code || require("../enums/statusCode").NoCode;
	this.error = err || {};
  this.data = data;
}

module.exports = response;