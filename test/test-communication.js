const net = require('net');
const assert = require('assert');
const { frame, Queue } = require('../index');

const sQueue          = new Queue();
const cQueue          = new Queue();
const buffer_send     = Buffer.from('test string');
const buffer_response = Buffer.from('response test string');

const path = `/tmp/stock-${Date.now()}`;
let server = new net.Server();

server.listen({ path });

server.on('connection', ( socket )=> {
  frame( socket ).on('message',( message )=> {
   sQueue.push( message, socket );
  });
});

let client = null;

describe('Client <-> Server',function(){
  client =  new net.Socket();
  client.connect({ path });

  frame(client).on('message',( message )=> {
    cQueue.push( message );
  });
    it('client',function( done ) {

      client.send(buffer_send);

      sQueue.once('next',( message )=> {
        if(message.body.compare(buffer_send)===0){
          //setTimeout(done,50);
          done();
        }
        else{
          done( new Error(message.body.toString()+'!=='+ buffer_send.toString() ) );
        }
      });

    });

    it('server',function( done ) {

      client.send(  buffer_send  );

      sQueue.on('next',( message, socket )=> {
        socket.send( buffer_response );
      });

      cQueue.once('next',( message )=>{
        if(message.body.compare(buffer_response)===0){ done(); }
        else{
          done( new Error(message.body.toString()+'!=='+ buffer_response.toString() ) );
        }
      });

    });

},1000);
