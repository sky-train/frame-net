#frame-net

##socket.send
server
```javascript
const { frame } = require('frame-net');
const server   = new net.createServer();

server.on('connection', ( socket )=> {
  frame( socket ).on('message', ( message )=> {
    console.log( typeof( message ) );
  });
});

```
client

```javascript
const { fram } = require('frame-net');

const client   = new net.Socket();

frame(client).on('message', ( message )=> {
  console.log( typeof( message ) );
});

client.send( Buffer.from( 'test' ) );

```

##socket.fetch
server
```javascript

frame(client)

client.fetch( Buffer.from( 'request' ) ).then(( res )=>{
  console.log( typeof( res ) );
})
.catch( ( err )=>{

})

```