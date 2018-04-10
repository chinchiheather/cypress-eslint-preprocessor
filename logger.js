function Logger() {
  this.log = (message, ...rest) => console.log(message, ...rest);
  this.warn = (message, ...rest) => console.warn(message, ...rest);
  this.error = (message, ...rest) => console.error(message, ...rest);
}

module.exports = Logger;
