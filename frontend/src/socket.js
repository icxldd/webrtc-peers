import io from 'socket.io-client'

const server =  process.env.NODE_ENV === 'development' ? `${IPAddress}:9000`:'https://gusheng123.top'

export default io(server)
