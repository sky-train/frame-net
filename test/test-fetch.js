const net = require('net');
const assert = require('assert');
const { frame, Queue } = require('../index');

const reqBody = Buffer.from('test string');
const resBody = Buffer.from('response test string'.repeat( 16384 ) );
console.log(resBody.length)
const path = `/tmp/stock-${Date.now()}`;

let server = new net.Server();

server.listen({ path });

server.on('connection', ( socket )=> {
  frame( socket ).on('message',( message )=> {
    if( message.type === 1 ) {

      message.body = resBody;
      setTimeout(()=>{ socket.send(message);}, 80 );
    }
  });
});

let client = null;

describe('fetch',function(){
  client =  new net.Socket();
  client.connect({ path });

  frame( client ).on( 'message' ,( message )=> {
    if(message.type===1){
      message.body = resBody;
      client.send(message);
    }
  });
    
  it('client.fetch()',function( done ) {

    client.fetch(reqBody, 100 ).then( ( message )=> {
      assert.equal(message.body.compare(resBody),0);
      done();
    }).catch(( err )=>{
      console.log(err);
    });

  });

},1000);
