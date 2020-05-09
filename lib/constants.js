/**
 *   HEADER
    -------------------------------
    | name                 | length
    |----------------------|-------- 
    | full size            | 4
    | type                 | 1
    | key                  | 14
    | error code           | 2
    |------------------------------
    | header size          | 21
    |------------------------------
    | data                 | full size - header size
    |------------------------------

     type 
        0 message
        1 request
        2 response
        3 request error  ( client.req.error() | timeout ) send to server ( client error )
        4 response error ( server.req.error() | server.res.error() ) send to client ( server error )

    key format
        time   8
        pid    4
        cnt    2

    ERRORS
        0 none
        1 timeout
        2 key dublicate
 */

const LENGTH_SIZE = 4;
const TYPE_SIZE = 1;
const KEY_SIZE = 14;
const ERROR_SIZE = 2;
const SHIFT_LENGTH = 0;
const SHIFT_TYPE = LENGTH_SIZE;
const SHIFT_KEY = LENGTH_SIZE + TYPE_SIZE;
const SHIFT_ERROR = LENGTH_SIZE + TYPE_SIZE + KEY_SIZE;
const HEADER_SIZE = LENGTH_SIZE + TYPE_SIZE + KEY_SIZE + ERROR_SIZE;
const SHIFT_BODY = HEADER_SIZE;

const SHIFT_KEY_TIME = 0;
const SHIFT_KEY_PID = 8;
const SHIFT_KEY_CNT = 12;


const MESSAGE = 0;
const REQUEST = 1;
const RESPONSE = 2;
const REQUEST_ERROR = 3;
const RESPONSE_ERROR = 4;

const DEFAULT_TIMEOUT = 2 * 60 * 1000;
const ERROR_NONE = 0;
const ERROR_TIMEOUT = 1;
const ERROR_DUBLICATE_KEY = 2;
const ERROR_CUSTOM = 99;

module.exports = {
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
    ERROR_NONE,
    ERROR_DUBLICATE_KEY,
    ERROR_CUSTOM
}