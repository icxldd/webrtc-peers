const webpack = require("webpack")
function getIPAdress() {
  let localIPAddress = ''
  let interfaces = require('os').networkInterfaces()
  for (let devName in interfaces) {
    let iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        localIPAddress = alias.address
      }
    }
  }
  return localIPAddress
}

module.exports = {
  chainWebpack(config){

    config.plugin('define').tap(args => {
      args[0]['IP'] = process.env.NODE_ENV === 'development'?  JSON.stringify('http://'+getIPAdress()+':9000') : 'https://gusheng123.top'
      return args
    })
    config.resolve.alias.set('assets', '@/assets')
    config.resolve.extensions.add('.css',).add('.scss')
  },
}
