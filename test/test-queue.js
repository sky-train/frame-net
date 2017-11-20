'use strict';
const assert = require('assert');
const { Queue } = require('../lib/queue');
const test_data = new Buffer([1,2,3]);
let queue  = null;
describe('Queue', ()=>{
  it('create', ()=>{
    queue = new Queue();
  });

  it('execute', (done)=>{
    queue.on('next', (frame)=>{
      if(frame.compare(test_data)===0){
        done();
      }
      else{
        done(new Error(frame));
      }
    });
    queue.push(test_data);
  });

});