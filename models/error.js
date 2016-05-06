function error(msg, desc, type, errors) {
  this.message = typeof msg === 'object' ? msg.message : msg;
  this.description = desc || '';
  this.type = type || '';
  this.errors = errors || null;
}

module.exports = error;