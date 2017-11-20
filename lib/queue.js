const EventEmitter = require( 'events' );

/**
 * events queue
 */
class Queue extends EventEmitter {

  /**
   * @param {string} event='data'
   */
  constructor ( event = 'next' ) {

    super();
    this._list = [];

    /**
     * emit loop
     */
    this.loop = ()=> {

      if( this._list.length ) {
        this.emit( this._event , ...(this._list.shift()) );
      }

      if( this._list.length ) {
        setImmediate( this.loop );
        this._active = true;
      }
      else {
        this._active = false;
      }

    };

    /**
     * @private
     * @type {boolean}
     */
    this._active = false;

    /**
     * @private
     * @type {string}
     */
    this._event = event;

  }

  push( ...args ) {
    this._list.push( args );

    if( !this._active && this._list.length > 0 ) {
      setImmediate( this.loop );
      this._active = true;
    }

  }

}

module.exports = { Queue };