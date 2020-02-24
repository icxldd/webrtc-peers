module.exports = {
  configureWebpack: {
    resolve: {
      extensions: ['.js', '.vue', '.scss', '.css'],
      alias: {
        assets: '@/assets'
      }
    }
  }
}
