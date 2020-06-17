
function forwardEvent(event, from, to) {
  from.on(event, (...args) => {
    to.emit(event, ...args);
  })
}

function forwardOnce(event, from, to) {

  let eventFrom, eventTo;

  if (event && typeof (event) === 'object') {
    eventFrom = event.from;
    eventTo = event.to;
  }
  else {
    eventFrom = eventTo = event;
  }
  
  from.once(eventFrom, (...args) => {
    (to || from).emit(eventTo, ...args);
  })
}

module.exports = {
  forwardEvent,
  forwardOnce
}