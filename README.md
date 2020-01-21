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
import { WebsocketServer } from 'socket-sorcerer';
import { createServer } from 'http';

const server = createServer().listen(8088);

const wss = new WebsocketServer({
  serverOptions: {
    server
  },
  pingInterval: 5000,
  pingTimeout: 5000,
  authenticate: {
    eventName: 'auth',
    async eventHandler(token) {
      const user = { _id: '5e1c62a969a07513e8f99a73' };
      return user._id;
    },
    authTimeout: 3000
  },
  events: {
    connect (uid) {
      wss.getManager().join('test', uid);
    },
    check (data, uid) {
      console.log({data, uid})
    },
    disconnect (uid) {
    }
  }
});

// Built server has its own manager property which You can export end use anywhere:
const manager = wss.getManager();
manager.to('test').event('test').data({ testMode: true });
```

###### Server Options:
 - **serverOptions**: see ws.ServerOptions
 - **pingInterval**: interval between to ping probes in milliseconds,
 - **pingTimeout**: value when connection will be closed after ping probe fails in milliseconds,
 - **authenticate.eventName**: Your custom authenticate event name, should be implemented on client side too,
 - **authenticate.eventHandler**: Your custom authenticate event handler which should take provided from client side token and return user id
 - **authenticate.authTimeout**: value when connection will be closed after auth probe fails in milliseconds
 - **events**: Server side event handlers, all of them besides 'connect' and 'disconnect' take two args (data and uid)

###### Build client at the front end side:
```ecmascript 6
import { WebSocketClient } from 'socket-sorcerer';

const ws = new WebSocketClient({
  serverUrl: 'ws://localhost:8088',
  token: 'clientPersonalToken',
  doReconnectOnClose: true,
  reconnectInterval: 5000,
  authEventName: 'auth',
  events: {
    test: (data) => {
      ws
        .to('test')
        .event('check')
        .data({ checked: true });
    }
  }
});

// You can export ws object and use it anywhere 
 ws
        .to('test')
        .event('check')
        .data({ checked: true });
```

###### Client Options:
  - **serverUrl**: Previously created WebSocket Server URL, f.e. 'ws://localhost:8088',
  - **token**: Personal token for authentication
  - **doReconnectOnClose**: Boolean identifier which indicate to do reconnects, recommended value is true,
  - **reconnectInterval**: Interval between reconnect attempts in milliseconds,
  - **authEventName**:  Authenticate event name the same as the server side,
  - **events**: Client side event handlers
  
Thank You and Good Luck!
