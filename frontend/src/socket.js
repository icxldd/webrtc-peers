import io from 'socket.io-client'
// console.log(WEBSOCKET_SERVER)

const server =  process.env.NODE_ENV === 'development' ? 'http://192.168.0.105:9000':'https://gusheng123.top'

export default io(server)
