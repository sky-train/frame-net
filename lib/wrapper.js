
const {
  MESSAGE,
  REQUEST,
  RESPONSE,
  REQUEST_ERROR,
  RESPONSE_ERROR,
  HEADER_SIZE,
  ERROR_TIMEOUT
} = require('./constants');

const {
  Request,
  IncomeRequest
} = require('./request');

const {
  Response,
  IncomeResponse
} = require('./response');

const parser = require('./parser');

const { Handler, Handlers } = require('./handler');

function wrapper(socket) {

  const handlers = new Handlers();

  let tail;
  let handler;

  socket.fetch = (data) => {

    const request = data instanceof Request
      ? data
      : new Request(data);


    const body = parser.toBuffer(request.data);
    const header = parser.newHeader({
      type: REQUEST,
      body
    });

    const handler = new Handler({ header, send });
    handlers.set(handler);

    // if cleint has request handler on out side 
    if( data === request ) {
      request.once('clientError', handler.requestError);
    }


    return new Promise((resolve, reject) => {

      handler.resolve = resolve;
      handler.reject = reject;

      socket.write(parser.pack(header, body));

      if (request.timeout) {
        handler.timer = setTimeout(handler.requestError, request.timeout, ERROR_TIMEOUT);
      }

    });

  };

  socket.send = (body) => {
    const { buffer } = parser.create({
      type: MESSAGE,
      body
    });
    return socket.write(buffer);
  };

  socket.on('data', (chunk) => {

    let buffer;
    let readContinue;

    buffer = tail
      ? Buffer.concat([tail, chunk])
      : chunk;


    do {
      // header
      if (!handler && buffer.length >= HEADER_SIZE) {
        const messageType = parser.getType(buffer);
        const header = parser.getHeader(buffer);

        switch (messageType) {
          case MESSAGE:
            // server side
            handler = new Handler({ header, send });
            socket.emit('request', new IncomeRequest(handler));

            break;
          case REQUEST:
            // server side
            handler = new Handler({ header, send });
            handlers.set(handler);
            socket.emit('request', new IncomeRequest(handler), new Response(handler));

            break;
          case RESPONSE:
            // client side 
            handler = handlers.get(header);

            if (handler) {
              const res = new IncomeResponse(handler);
              handler.requestEnd(res, header);
            }
            else {
              // not found handler
              // > client side destroy handler after timeout  
            }

            break;
          case REQUEST_ERROR:
            // server side
            handler = handlers.get(header);

            if (handler) {
              handler.emit('clientError', new Error(header.errCode));
            }
            else {
              // not found handler 
              // > server side destroy handler after response.end() 
            }

            break;
          case RESPONSE_ERROR:
            // client side 
            // > on server side call response.error();  
            handler = handlers.get(header);
            if (handler) {
              handler.requestError(header.errCode, true);
            }
            else {
              // not found handler
              // > client side destroy handler after timeout  
            }

            break;
          default:
            throw new Error('message type not supported');
        }

      }

      // body
      if (handler && buffer.length >= handler.header.size) {
        const body = parser.getBody(handler.header, buffer.slice(0, handler.header.size));

        switch (handler.header.type) {
          case MESSAGE:
          case REQUEST:
          case RESPONSE:
            if (handler.header.bodyUsed) {
              handler.emit('data', body);
            }    
            break;
          case REQUEST_ERROR:
          case RESPONSE_ERROR:
            break;
        }

        handlers.delete(handler);

        buffer = buffer.slice(handler.header.size);
        handler = void 0;
        readContinue = !!buffer.length;
      }
      else {
        readContinue = false;
      }
    } while (readContinue);

    tail = buffer.length ? buffer : void 0;

  });

  function send(buffer) {
    socket.write(buffer);
  }

  return socket;

}

module.exports = {
  wrapper
}