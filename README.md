```shell script
npm i -s socket-sorcerer;
```
**Socket Sorcerer** is a light-weight WebSocket framework based on 'ws' package.
 
In comparison with other libraries it has next advantages:
- already implemented reconnects, pinging, authentication etc
- the simplest implementation of full functionality in less rows of Your code
- easily integration in any application

Build server:
```ecmascript 6
import { WebSocketServer } from 'socket-sorcerer/server';
import { createServer } from 'http';

const server = createServer().listen(8088);

const wss = new WebSocketServer({
  serverOptions: {
    server
  },
  pingInterval: 5000,
  pingTimeout: 15000,
  authenticate: {
    eventName: 'auth',
    async eventHandler(token) {
      // token may be simple string or object contains string "token" property and other parameters
      const user = { _id: '5e1c62a969a07513e8f99a73' };
      return user._id;
    },
    authTimeout: 3000
  },
  events: {
    connect (connectionId, userId, token, userIp) {
      // event is emitting once after successful authentication
      wss.getManager().join({
        channel: 'my awesome channel',
        user: uid
      });
      wss.getManager().join({
        channel: 'for MacOS users only',
        connection: connectionId
      });
    },
    flud (data, connectionId, userId) {
      //process the data
    },
    disconnect (connectionId, userId, token) {
      // event is emitting when socket is closed
    },
    afterConnect (connectionId, userId, token) {
      // event is emitting  right after connect event and at each successful ping-pong
    }
  }
});

// Built server has its own manager property which You can export end use anywhere in the code:

const manager = wss.getManager();
manager.send({
  channel: 'for MacOS users only',
  event: 'update',
  data: {
    version: '1.2.3',
    downloadUrl: '...'
  }
});




```

###### Server Options:
 - **serverOptions**: see ws.ServerOptions
 - **pingInterval**: interval between to ping probes in milliseconds,
 - **pingTimeout**: value when connection will be closed after ping probe fails in milliseconds,
 - **authenticate.eventName**: Your custom authenticate event name, should be implemented on client side too,
 - **authenticate.eventHandler**: Your custom authenticate event handler which should take provided from client side 
 token and return user id
 - **authenticate.authTimeout**: value when connection will be closed after auth probe fails in milliseconds
 - **events**: Server side event handlers, all of them besides 'connect' and 'disconnect' take two args 
 (data and uid, "connect" and "disconnect" events take one arg - uid). 
 You can use '*' to define middleware which will be called previously 
 (except "connect", "disconnect" and service events)

###### Build client at the front end side:
```ecmascript 6
import { WebSocketClient } from 'socket-sorcerer/client';

const ws = new WebSocketClient({
  serverUrl: 'ws://localhost:8088',
  token: 'clientPersonalConnectToken',
  doReconnectOnClose: true,
  reconnectInterval: 5000,
  authEventName: 'auth',
  events: {
    test: (data) => {
      ws.emit({
        channel: 'test',
        event: 'message',
        data: {
          message: 'Hi there'
        }
      })
    }
  }
});

// You can export ws object and use it anywhere, e.g. just send something to the server 
 ws.emit({
   channel: 'flud',
   event: 'message',
   data: {
     message: 'Hi there'
   }
 });
```

###### Client Options:
  - **serverUrl**: Previously created WebSocket Server URL, f.e. 'ws://localhost:8088',
  - **token**: Personal token for authentication
  - **doReconnectOnClose**: Boolean identifier which indicate to do reconnects, recommended value is true,
  - **reconnectInterval**: Interval between reconnect attempts in milliseconds,
  - **authEventName**:  Authenticate event name the same as the server side,
  - **events**: Client side event handlers
