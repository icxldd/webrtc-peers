
import * as views from './views'

export default {
  install(vue, option) {
    Object.keys(views).forEach(key => {
      vue.component(key, views[key])
    })
  }
}
