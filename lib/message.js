/**
 * required
 * ******************************************************************
 * size    = 4
 * type    = 1  [ 0 - message, 1 - request(need response), 2 - response ]
 * ******************************************************************
 * key     = 12 [ time = 8, pid = 2, cnt = 2 ]
 * timeout = 2
 */

const frameLengthSize     = 4;
const messageTypeSize     = 1;
const keySize             = 12;
const timeoutSize         = 2;

const messageHeadSize     = frameLengthSize + messageTypeSize;
const requestHeadSize     = messageHeadSize + keySize + timeoutSize;

const shiftMessageType    = 4;
const shiftTimeout        = messageHeadSize + keySize;
const shiftKey            = messageHeadSize;

const counter             = new Uint16Array(1);

function createKey(){
  let key = Buffer.alloc(12);
  key.writeDoubleBE(Date.now(), 0);
  key.writeUInt16BE(process.pid, 8);
  key.writeUInt16BE(counter[0]++, 10);
  return key;
}

class Message {

  constructor ( frame = {}, income = false ) {

    this.income = income;
    this.timestamp = Date.now();

    if( Buffer.isBuffer( frame ) ) {

      const messageType = frame.readUInt8( shiftMessageType );
      const shiftBody   = messageType? requestHeadSize: messageHeadSize;

      this.buffer    = frame;
      this.head      = frame.slice( 0, shiftBody );

      if(frame.length > shiftBody) {
        this._bodyBuffer = frame.slice( shiftBody );
      }
      else {
        this._bodyBuffer = null;
      }

    }
    // object format { key:Buffer, body : Buffer, timout:, type: } 
    else if( typeof( frame ) === 'object' ) {

      const messageType = frame.type || 0;

      this.head = Buffer.alloc( messageType ? requestHeadSize: messageHeadSize );
      this.head.writeUInt8( messageType, shiftMessageType );

      this.body = frame.body? frame.body: null;

      if( messageType ) {
        this.key       = frame.key? frame.key: createKey();
        this.timeout   = frame.timeout? frame.timeout: 0;
      }

    }

  }

  get timeout(){
    if(this.type!==0){
      return this.head.readUInt16BE( shiftTimeout );
    }
    return null;
  }

  set timeout( value ) {
    if( !this.income && this.type!==0 ) {

      if( typeof(value)!=='number' || value<0 || value>65535) {
        throw new Error( 'timeout value out of range' );
      }

      if( this.timeout!==value ) {
        this.buffer = null;
        this.head.writeUInt16BE( value, shiftTimeout );
      }

    }
  }

  get type() {
    return this.head.readUInt8(shiftMessageType);
  }

  set type( value ) {

    // 0 message, 1 request, 2 response

    if( typeof( value ) !== 'number' || value<0 || value >2 ) {
      throw new Error('not valid message type');
    }

    const current = this.type;
    
    if( current !== value ) {

      this.buffer = null;

      if( this.income && current === 1 && value !== 2) {
        throw new Error('income request type change only to response');
      }

      switch( current ) {
        case 0:
          
          this.head = Buffer.alloc( reuestHeadSize );
          this.head.writeUInt8( value, shiftMessageType );
          this.key = createKey();
          
          break;
        case 1:
          
          if( value === 0 ) {
            this.head = Buffer.alloc( messageHeadSize );
          }
          
          this.head.writeUInt8( value, shiftMessageType );
          
          break;
        case 2:
          
          if( value === 0 ) {
            this.head = Buffer.alloc( messageHeadSize );
          }
          
          this.head.writeUInt8( value, shiftMessageType );
          
          
          break;
        default:
          throw new Error('protocol system error');

      }
    }

  }

  get key() {
    if( this.type!==0 ) {
      return this.head.slice( shiftKey, shiftTimeout );
    }
    return null;
  }

  set key( value ) {

    if( !this.income && this.type!==0 ) {
      
      if( !Buffer.isBuffer( value ) || value.byteLength!==12 ) {
        throw new Error( 'not valid key');
      }
      
      if( this.key.compare( value )!==0 ) {
        this.buffer = null;
        value.copy( this.head, shiftKey, 0 );
      }
    
    }

  }

  get asciiKey(){
    if( this.type!==0 ) {
      return this.head.slice( shiftKey, shiftTimeout ).toString('ascii');
    }
    return null;
  }

  get body(){
    return this._bodyBuffer;
  }

  set body( value ) {
    if(Buffer.isBuffer( value )  || value===null ){
      this.buffer = null;
      this._bodyBuffer = value;
    }
    else {
      throw new Error('data not buffer');
    }
  }

  valueOf() {

    if( !this.buffer ) {

      const withData = !!this.body;
      const dataSize = withData? this.body.byteLength : 0;
      const headSize = this.type!==0 ? requestHeadSize : messageHeadSize;

      this.head.writeUInt32BE( headSize + dataSize, 0 );

      if( withData ) {
        this.buffer = Buffer.concat( [ this.head, this._bodyBuffer ] );
      }
      else {
        this.buffer = Buffer.concat( [ this.head ] );
      }

    }

    return this.buffer;

  }

}

module.exports = { Message };
