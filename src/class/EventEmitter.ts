export class EventEmitter {

  private handlers: any;

  constructor() {
    this.handlers = {};
  }

  public on(event: string, handler: Function) {
   if ( typeof event === 'string' && typeof handler === 'function') {
     this.handlers[event] = handler;
   }
  }

  public emit(event: string, data: any) {
    if ( this.handlers.hasOwnProperty(event) && typeof this.handlers[event] === 'function') {
      this.handlers[event](data);
    }
  }
}
