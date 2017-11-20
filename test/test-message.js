const assert = require('assert');
const { Message } = require('../lib/message');

const testDataString = 'testdata';

describe('Message', ()=>{

  it('new message', ()=> {
    let frame = new Message();
    assert.equal(frame.type,0);
    assert.equal(frame.key,null);
    assert.equal(frame.timeout,null);
    assert.equal(frame.asciiKey,null);
  });

  it('new request', ()=> {
    let frame = new Message({type:1});
    assert.equal(frame.type,1);
    assert.equal(frame.asciiKey.length,12);
  });

  it('message.type - change', ()=>{
    let frame = new Message({type:1});
    assert.equal(frame.head.length,19);
    frame.type = 2;
    assert.equal(frame.type,2);
    assert.equal(frame.head.length,19);

    frame.type = 0;

    assert.equal(frame.type,0);
    assert.equal(frame.head.length, 5);

  });

  it('message.body', ()=> {

    let frame  = new Message({body:Buffer.from(testDataString)});
    let frame2 = new Message(Buffer.concat([frame.valueOf()]));

    assert.equal(frame2.body.toString(),testDataString);


  });

  it('request.body', ()=> {

    let request  = new Message( { type:1, body:Buffer.from( testDataString ) } );
    let response = new Message(Buffer.concat([request.valueOf()]));
    response.type = 2;


    assert.equal(response.body.toString(),testDataString);
    assert.equal(request.key.compare(response.key),0);


  });

  it('pack-unpack (request)', ()=>{
    let request  = new Message({type:1, body:Buffer.from(testDataString)});
    let response = new Message(Buffer.concat([request.valueOf()]));
    response.type = 2;

    assert.equal(request.key.compare(response.key),0);
    assert.equal(request.body.toString(),testDataString);


  });

});
