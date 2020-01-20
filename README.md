```shell script
npm i -s 'socket-sorcerer';
```
Socket Sorcerer is a light-weight WebSocket framework based on 'ws' package. 
In comparison with other libraries it has next advantages:
- already implemented reconnects, pinging, authentication etc
- the simplest implementation of full functionality in less rows of Your code
- easily integration in any application
git
Build server:
```ecmascript 6
import { WebsocketServer } from 'socket-sorcerer';
import { createServer } from 'http';

const server = createServer().listen(8088);

const wss = new WebsocketServer({
  // see ws.ServerOptions
  serverOptions: {
    server
  },
  // interval between to ping probes in milliseconds
  pingInterval: 5000,
  // value when connection will be closed after ping probe in milliseconds
  pingTimeout: 5000,
  authenticate: {
    // Your custom authenticate event Name, should be implemented on client side too
    eventName: 'auth',
    // Your custom authenticate event handler which should take provided from client side token and return user id
    async eventHandler(token) {
      // do something to authenticate user by provided token
      const user = { _id: '5e1c62a969a07513e8f99a73' };
      return user._id;
    },
    // value when connection will be closed after auth probe in milliseconds
    authTimeout: 3000
  },
  // Server side event handlers, all of them besides 'connect' and 'disconnect' take two args (data and uid)
  events: {
    connect (uid) {
      wss.getManager().join('test', uid);
    },
    check (data, uid) {
      console.log({data, uid})
    },
    disconnect (uid) {
      // handle disconnect from WebSocket server
    }
  }
});

// Built server has its own manager property which You can export end use anywhere:
const manager = wss.getManager();
manager.to('test').event('test').data({ testMode: true });
```

Build client at the front end side:
```ecmascript 6
import { WebSocketClient } from 'socket-sorcerer';

const ws = new WebSocketClient({
  // Previously created WebSocket Server URL
  serverUrl: 'ws://localhost:8088',
  // Personal token for authentication
  token: 'clientPersonalToken',
  // Boolean identifier which indicate to do reconnects, recommended value is true
  doReconnectOnClose: true,
  // Interval between reconnect attempts in milliseconds
  reconnectInterval: 5000,
  // Authenticate event name the same as the server side
  authEventName: 'auth',
  // Client side event handlers
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

Thank You and Good Luck!
