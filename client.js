const { WebSocketNodeJSClient } =require('./dist');



async function main() {

  const s = new WebSocketNodeJSClient( {
    serverUrl: 'ws://localhost:8080',
    token: { platform: 'win', version: '123', token: 'aaa'},
    doReconnectOnClose: true,
    reconnectInterval: 1000,
    authEventName: 'auth',
    events: {
      test: (a,b,c,d) => {
        console.log({ a,b,c,d})
      }
    },
    hooks: {
      onOpen:  (d) => {
        console.log('open', d)
      },
      onClose: (c) => {
        console.log('close', c)
      }
    }})
  await  s.activate();
  console.log('ready')
}

main().catch(console.log)
