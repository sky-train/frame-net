const { Message, FRAME_LENGTH_SIZE, FIRST_CHUNK_SIZE, FRAME_HEAD_SIZE } = require('./message');

function frame(socket, objectMode = false) {

  const requests = new Map();

  socket.objectMode = objectMode;

  let receiver;
  let frameLength;
  let messageType;
  let messageKey;

  socket.fetch = (message, timeout = 0) => {

    if (objectMode && !Buffer.isBuffer(message) && !(message instanceof Message)) {
      message = Buffer.from(JSON.stringify(message));
    }

    if (Buffer.isBuffer(message)) {
      message = new Message({ body: message, type: 1, timeout });
    }

    if (message.type === 1) {
      const key = message.asciiKey;
      const timeout = message.timeout;

      if (timeout) {
        return Promise.race(
          [
            new Promise((resolve, reject) => {
              requests.set(key, { resolve, reject });
              socket.write(message.valueOf());
            }),
            new Promise((resolve, reject) => {
              const item = requests.get(key);
              item.timeoutObj = setTimeout(() => {
                requests.delete(key);
                item.timeoutObj = null;
                reject(new Error('timeout'));
              }, timeout);
            })
          ]
        );
      }
      else {
        return new Promise((resolve, reject) => {
          requests.set(key, { resolve, reject });
          socket.write(message.valueOf());
        });
      }
    }
    else {
      throw new Error('message type not request');
    }

  };

  socket.send = (message) => {

    if (objectMode && !Buffer.isBuffer(message) && !(message instanceof Message)) {
      message = Buffer.from(JSON.stringify(message));
    }

    if (Buffer.isBuffer(message)) {
      message = new Message({ body: message });
    }

    if (message.income && message.type === 1) {
      message.type = 2;
    }

    socket.write(message.valueOf());

  };

  socket.on('data', (chunk) => {
    /**
     * @type {Buffer}
     */
    let buffer;

    buffer = receiver ? Buffer.concat([receiver, chunk]) : chunk;

    if (!frameLength) {
      if (buffer.length >= FIRST_CHUNK_SIZE) {
        frameLength = buffer.readUInt32BE(0);
        messageType = buffer.readUInt8(FRAME_LENGTH_SIZE);
      }
    }

    if (messageType === 2) {

      if (!messageKey && buffer.length >= FRAME_HEAD_SIZE) {
        messageKey = buffer.slice(FIRST_CHUNK_SIZE, FRAME_HEAD_SIZE).toString('ascii');
      }

      if (messageKey) {
        const item = requests.get(messageKey);
        if (item) {
          if (item.timeoutObj) {
            clearTimeout(item.timeoutObj);
            item.timeoutObj = null;
          }
        }
        messageType = undefined;
        messageKey = undefined;
      }
    }

    while (frameLength <= buffer.length) {

      const message = new Message(buffer.slice(0, frameLength), true);

      if (message.type === 2) {

        const key = message.asciiKey;
        const item = requests.get(key);
        if (item) {
          requests.delete(key);
          if (objectMode) {
            let _objectBody;
            try {
              _objectBody = JSON.parse(message.body);
            }
            catch (err) {
              socket.emit('error', err);
              return;
            }
            item.resolve(_objectBody);
          }
          else {
            item.resolve(message);
          }
        }
        else {
          socket.emit('lost-responses', message);
        }

      }
      else {
        if (objectMode) {
          let _objectBody;
          try {
            _objectBody = JSON.parse(message.body);
          }
          catch (err) {
            socket.emit('error', err);
            return;
          }
          socket.emit('message', _objectBody);
        }
        else {
          socket.emit('message', message);
        }
      }

      buffer = buffer.slice(frameLength);

      if (buffer.length >= FIRST_CHUNK_SIZE) {
        frameLength = buffer.readUInt32BE(0);
        messageType = buffer.readUInt8(FRAME_LENGTH_SIZE);

        if (messageType === 2) {

          if (!messageKey && buffer.length >= FRAME_HEAD_SIZE) {
            messageKey = buffer.slice(FIRST_CHUNK_SIZE, FRAME_HEAD_SIZE).toString('ascii');
          }

          if (messageKey) {
            const item = requests.get(messageKey);
            if (item) {
              if (item.timeoutObj) {
                clearTimeout(item.timeoutObj);
                item.timeoutObj = null;
              }
            }
            messageType = undefined;
            messageKey = undefined;
          }
        }

      }
      else {
        frameLength = undefined;
        break;
      }

    }

    receiver = buffer.length ? buffer : undefined;

  });

  return socket;

}

module.exports = { frame };