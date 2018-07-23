const net = require('net');
const assert = require('assert');
const { frame } = require('../index');

const testData = { name: 0, args: [{ name: 1 }, 44] };


const path = `/tmp/frame-net-test.stock`;
try { fs.unlinkSync(path); } catch (err) { }

let server = new net.Server();

server.listen({ path });

server.on('connection', (socket) => {
  frame(socket, true).on('message', (message) => {
    socket.send(message);
  });
});

let client = null;

describe('Client <- Object Mode -> Server', function () {

  client = new net.Socket();
  client.connect({ path });
  frame(client, true);

  it('send', function (done) {

    client.once('message', (message) => {
      done( duckCompare(message, testData)? undefined: new Error( ) );
    });

    client.send(testData);

  });

}, 1000);


function duckCompare(obj1, obj2) {

  const properties = Object.keys(obj1);
  for (const property of properties) {
    if (typeof (obj1[property]) === 'object' && obj1[property] !== null) {
      if( !duckCompare( obj1[property], obj2[property] ) ) {
        return false;
      }
    }
    else {
      if (obj1[property] !== obj2[property]) {
        return false;
      }
    }
  }
  return true;
}