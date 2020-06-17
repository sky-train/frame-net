const { EventEmitter } = require('events');
const { BodyLoader } = require('./body-loader');
const { forwardOnce } = require('./utils');


const OPEN = 0;
const CLOSE = 1;


// Response on server side 
class Response extends EventEmitter {
  #state = OPEN; // 0 open, 1 close 
  #destroyed;

  #destroy = (err,key) => {
    this.#destroyed = true;
  }

  constructor(handler) {
    super(handler);

    handler.once('clientError', this.#destroy);
    this.once('responseEnd', handler.responseEnd);
    this.once('responseError', handler.responseError);

    forwardOnce('clientError', handler, this);

  }

  get ok() { return this.ok; }

  end(body) {
    if (!this.#destroyed) {
      if (this.#state === OPEN) {
        this.#state = CLOSE;
        this.emit('responseEnd', body);
      }
      else {
        throw new Error('dublue call');
      }
    }
  }

  error(errCode) {
    if (!this.#destroyed) {
      if (this.#state === OPEN) {
        this.#state = CLOSE;
        this.emit('responseError', errCode);
      }
      else {
        throw new Error('duble call');
      }
    }

  }

}

// Response on cliet side
class IncomeResponse extends BodyLoader {

}

module.exports = {
  Response,
  IncomeResponse
}