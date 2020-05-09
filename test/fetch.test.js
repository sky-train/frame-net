const net = require('net');
const { unlinkSync, existsSync } = require('fs');
const { wrapper, forwardEvent, Request } = require('../index');

const path = '/tmp/jarvis-tcp.stok'

if (existsSync(path)) {
  unlinkSync(path);
}

const server = net.createServer((socket) => {
  forwardEvent('request', wrapper(socket), server);
});


const client = wrapper(new net.Socket());

server.listen(path, () => {
  client.connect(path, () => {


    const req = new Request( { data: "444"}, 20);

    //setTimeout() req.error();

    client.fetch(req)
      .then((res) => {
        res.body.json().then((body) => {
          console.log(body)
        })
      })
      .catch((err) => {
        console.log('catch',err);
      })
  })
})


server.on('request', (req, res) => {
  req.body.text().then((body) => {
    console.log(body);

    res.end({ response: 'ok' })
    //res.error(255);

    // setTimeout(()=>{
    //   console.log( 'end after client error')
    //   res.end();
    // }, 2000)
  })

  req.on('clientError', (err) => {
    console.log('clientError',err);
  })
})
