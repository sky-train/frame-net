const { EventEmitter } = require('events');
const parser = require('./parser');
const {

  RESPONSE,
  RESPONSE_ERROR,
  REQUEST_ERROR,
  ERROR_CUSTOM

} = require('./constants');


class Handlers extends Map {

  set(handler) {
    const key = handler.header.key.toString('ascii');
    if (this.has(key)) {
      throw new Error();
    }

    super.set(key, handler);
  }

  delete(handler) {
    const key = handler.header.key.toString('ascii');
    super.delete(key);
  }

  get(header) {
    const key = header.key.toString('ascii');
    return super.get(key);
  }

}

class Handler extends EventEmitter {
  
  // events
  //  data
  //  clientError
  //  destroy

  header;
  resolve;
  reject;
  timer;

  constructor(source) {

    super();

    this.header = source.header;
    this.send = source.send;

    this.on('clientError', this.destroy);
  }

  // client side
  requestEnd = (res, resHeader) => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.header = resHeader;
    this.resolve(res);
  }

  // client side
  requestError = (errCode, noNotify) => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    errCode = getErrorCode(errCode);
    const err = new Error(errCode);

    if (!noNotify) {
      const { buffer } = parser.create({
        type: REQUEST_ERROR,
        key: this.header.key,
        errCode
      });

      this.send(buffer);
    }

    this.destroy(err);
    this.reject(err);

  }

  // server side
  responseEnd = (body) => {
    const { buffer } = parser.create({
      type: RESPONSE,
      key: this.header.key,
      body
    });

    this.send(buffer);
    this.destroy();

  }

  // server side
  responseError = (errCode) => {
    errCode = getErrorCode(errCode);
    const err = new Error(errCode);
    const { buffer } = parser.create({
      type: RESPONSE_ERROR,
      key: this.header.key,
      errCode
    });

    this.send(buffer);
    this.destroy(err);
  }

  destroy = (err) => {
    this.emit('destroy', err);
  }

}


function getErrorCode(errCode) {
  return Number.isInteger(errCode) && errCode >= 0 && errCode <= 65355 ? errCode : ERROR_CUSTOM;
}


module.exports = {
  Handler,
  Handlers
}