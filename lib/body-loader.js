const { EventEmitter } = require('events');

const PENDING = 0;
const INITIALIZED = 1;
const COMPLETED = 2;

class BodyLoader extends EventEmitter {

  #buffer;
  #bodyFormat;
  #bodyLoaded;
  #bodyUsed = false;
  #state = PENDING;
  #promise
  #resolve;
  #destroyed;
  
  #handlerDestroy =( err )=>{
    if( err ) {
      this.#destroy();
    }
  }

  #destroy = () => {
    if (!this.#destroyed) {
      this.#destroyed;
      this.#state = COMPLETED;
      this.#buffer = void 0;
      this.#resolve = void 0;
      this.#promise = void 0;
    }
  }

  #data = (buffer) => {
    this.#buffer = buffer;
    this.#bodyLoaded = true;

    if (this.#state === INITIALIZED) {
      const resolve = this.#resolve;
      const format = this.#bodyFormat;
      this.#destroy();
      return resolve(toFormat(format, buffer));
    }

  }

  #initialize = (format) => {

    if ([PENDING,INITIALIZED].includes(this.#state)) {
      this.#bodyFormat = format;
      this.#state++;
      if (this.#bodyLoaded || !this.#bodyUsed) {
        const buffer = this.#buffer;
        this.#destroy()
        return Promise.resolve(toFormat(format, buffer));
      }
      else {
        return this.#promise;
      }
    } else {
      throw new Error();
    }

  }

  constructor(handler) {
    super();

    handler.once('data', this.#data);
    handler.once('destroy', this.#handlerDestroy);

    this.#bodyUsed = handler.header.bodyUsed;

    if (this.#bodyUsed) {
      this.#promise = new Promise(resolve => this.#resolve = resolve);
    }

    this.body = {
      json: () => this.#initialize('json'),
      text: () => this.#initialize('text'),
      buffer: () => this.#initialize('buffer')
    }

  }

  get bodyUsed() {
    return this.#bodyUsed;
  }

}

function toFormat(format, buffer) {
  if (buffer !== void 0) {
    switch (format) {
      case 'buffer':
        return buffer;
      case 'json':
        return JSON.parse(buffer);
      case 'text':
        return buffer.toString();
      default:
        throw new Error(`no support format: ${format}`);
    }
  }
}

module.exports = {
  BodyLoader
}