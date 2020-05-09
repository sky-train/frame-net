const { EventEmitter } = require('events');
const { DEFAULT_TIMEOUT } = require('./constants');
const { BodyLoader } = require('./body-loader');
const { forwardOnce } = require('./utils');
// Request in client side
class Request extends EventEmitter {

  #data;
  #timeout;

  constructor(data, options) {
    super();
    this.#timeout = Number.isInteger(options)
      ? options
      : (options && options.timeout)
        ? options.timeout
        : DEFAULT_TIMEOUT;

    this.#data = data;
  }

  error(code) { this.emit('requestError', code); }

  get data() { return this.#data }
  get timeout() { return this.#timeout }

}

// Request in server side
class IncomeRequest extends BodyLoader {

  #ok= true;
  #destroyed;

  constructor(handler) {
    super(handler);
    forwardOnce('clientError', handler, this);
  }

}

module.exports = {
  Request,
  IncomeRequest
}