
import { Message } from 'element-ui'
import axios from 'axios'

const instance = axios.create({
  timeout: 5000
})

instance.interceptors.request.use(
  function(config) {
    // config.headers.token = User.state.token
    return config
  },
  function(error) {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  function(res) {
    return res.data
  },
  function(error) {
    Message.error('通讯错误', { type: 'error' })
  }
)

export default instance
