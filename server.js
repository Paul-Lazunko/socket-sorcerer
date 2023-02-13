const { WebsocketServer } = require('./dist');
const {createServer} = require('http');
const server = createServer().listen(8080, () => {
  console.log('server started')
});

const ws = new WebsocketServer({
  serverOptions: {
    server
  },
  pingInterval: 10000,
  pingTimeout: 3000,
  authenticate: {
    authTimeout: 3000,
    eventName: 'auth',
    eventHandler: (token, ip) => {
      console.log(token)
      return '12345'
    }
  },
  events:{
    connect(uid, token, ip) {
      console.log({ uid, token, ip })
    },
    disconnect(uid, token, ip) {
      console.log({ uid, token, ip })
    },
  }
}).getManager();

setTimeout(() => {
  console.log('sent message')
  ws.to('12345').event('test').data({ test: true })
}, 10000)
