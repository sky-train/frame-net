const {
    KEY_SIZE,
    TYPE_SIZE,
    LENGTH_SIZE,
    ERROR_SIZE,
    SHIFT_ERROR,
    SHIFT_KEY,
    SHIFT_TYPE,
    SHIFT_LENGTH,
    SHIFT_BODY,
    SHIFT_KEY_TIME,
    SHIFT_KEY_PID,
    SHIFT_KEY_CNT,
    HEADER_SIZE,
    MESSAGE,
    REQUEST,
    RESPONSE,
    REQUEST_ERROR,
    RESPONSE_ERROR,
    DEFAULT_TIMEOUT,
    ERROR_TIMEOUT,
    ERROR_NONE
} = require('./constants');

const counter = new Uint16Array(1);


function create(options) {

    const { type = MESSAGE, body: data, errCode = ERROR_NONE } = options;
    const key = Buffer.isBuffer(options.key) ? Buffer.from(options.key) : newKey();
    const bodyUsed = !!data;
    const body = toBuffer(data);
    const size = HEADER_SIZE + body.length;
    const buffer = pack({ type, key, errCode }, body);

    return {
        header: {
            key,
            size,
            type,
            errCode,
            bodyUsed
        },
        buffer
    }

}

function newKey() {
    const key = Buffer.alloc(KEY_SIZE);
    key.writeDoubleBE(Date.now(), SHIFT_KEY_TIME);
    key.writeUInt32BE(process.pid, SHIFT_KEY_PID);
    key.writeUInt16BE(counter[0]++, SHIFT_KEY_CNT);
    return key;
}

function newHeader(options = {}) {
    const { type = MESSAGE, body = Buffer.from(''), errCode = ERROR_NONE } = options;
    if (!Buffer.isBuffer(body)) {
        throw new TypeError();
    }

    const key = newKey();
    const bodyUsed = !!body.length;
    const size = HEADER_SIZE + body.length;

    return {
        key,
        type,
        size,
        errCode,
        bodyUsed
    }
}

function toBuffer(data) {
    if (data !== void 0) {
        if (!Buffer.isBuffer(data)) {
            data = Buffer.from(JSON.stringify(data));
        }
        return data;
    }
    return Buffer.from('');
}

function pack(header, body) {

    const size = HEADER_SIZE + body.length;
    const buffer = Buffer.alloc(size);

    buffer.writeUInt32BE(size, SHIFT_LENGTH);
    buffer.writeUInt8(header.type, SHIFT_TYPE);
    header.key.copy(buffer, SHIFT_KEY);
    buffer.writeUInt16BE(header.errCode, SHIFT_ERROR);
    body.copy(buffer, SHIFT_BODY);

    return buffer

}

function unpack(buffer) {

    const header = getHeader(buffer);

    let body;
    if (buffer.length >= header.size) {
        body = buffer.slice(SHIFT_BODY);
    }
    return {
        header,
        body
    };
}

function getType(buffer) {
    return buffer.readUInt8(SHIFT_TYPE);
}

function getHeader(buffer) {

    const size = buffer.readUInt32BE(SHIFT_LENGTH);
    const type = buffer.readUInt8(SHIFT_TYPE);
    const key = buffer.slice(SHIFT_KEY, SHIFT_ERROR);
    const errCode = buffer.readUInt16BE(SHIFT_ERROR);
    const bodyUsed = size > HEADER_SIZE;

    return {
        key,
        size,
        type,
        errCode,
        bodyUsed
    };
}

function getBody(header, buffer) {
    if (buffer.length >= header.size) {
        return buffer.slice(SHIFT_BODY);
    }
    return null
}

module.exports = {
    getHeader,
    getBody,
    create,
    newKey,
    newHeader,
    pack,
    unpack,
    getType,
    toBuffer
}