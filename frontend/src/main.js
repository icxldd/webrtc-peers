
import 'element-ui/lib/theme-chalk/index.css'
import '@/style/init.scss'
import 'video.js'
import  'webrtc-adapter'

import Vue from 'vue'
import App from './App'
import router from '@/router'
import elementUi from 'element-ui'
import plugin from './plugin'


Vue.use(elementUi).use(plugin)
Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  render:h => h(App)
})
