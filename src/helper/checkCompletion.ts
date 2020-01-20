export function checkCompletion(room: any, event: any, data: any, handler: Function) : boolean {
  if ( room && event && data ) {
    handler(room, event, data);
    return true;
  }
  return false;
}
