// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import elementUi from 'element-ui'
import plugin from './plugin'
import './style/init.scss'

Vue.use(elementUi).use(plugin)
Vue.config.productionTip = false

const aa = new Vue({
  el: '#app',
  router,
  ...App
})
console.log((window.aa = aa))
