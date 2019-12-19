import pack from './pack.js'
import unpack from './unpack.js'
import { encode, randomStr } from './tool'
export default class DataTrans {
  sendQueue = []
  _backupObj = {}
  _events = {}
  constructor() {
    unpack.onmessage = data => {
      console.log('ove', data)
      this.emit('unpackover', data)
    }
    unpack.onnotice = this._notice.bind(this)
    unpack.onfeedback = this._feedback.bind(this)

    this.unpack = unpack
    pack.onmessage = this._getPackeddata.bind(this)
  }
  pack(val) {
    const messageId = randomStr()
    pack(val, messageId)
    return messageId
  }
  /**
   *
   * @param {string} messageId
   * @param {0:收到首条数据,1:收到尾条数据,2:丢失信息重发,9：收到完整信息} type
   */
  _notice(data) {
    const sendBuffer = encode(`%${JSON.stringify(data)}`)
    this.sendQueue.push(sendBuffer)
    this._packover()
  }
  /**
   * 通知信息的反馈
   * @param { messageId, type, lack} data
   */
  _feedback({ messageId, type, lack }) {
    if (!this._backupObj[messageId]) {
      return
    }
    console.log('feed', messageId, type, lack)
    if (type === 0) {
      clearInterval(this._backupObj[messageId].firstInterval)
    } else if (type === 1) {
      clearInterval(this._backupObj[messageId].lastInterval)
    } else if (type === 9) {
      clearInterval(this._backupObj[messageId].lastInterval)
      clearInterval(this._backupObj[messageId].firstInterval)
      Reflect.deleteProperty(this._backupObj, messageId)
    } else if (type === 2) {
      const buffers = this._backupObj[messageId].buffers
      const buffersBack = {}
      const needsend = lack.map(it => {
        return (buffersBack[it] = buffers[it])
      })
      this._backupObj[messageId].buffers = buffersBack
      this.sendQueue.push(...needsend)
    }
  }
  _getPackeddata(buffer, index, messageId, fin) {
    this._backup(buffer, index, messageId)

    if (!index || fin) {
      const interval = this._sendUntilFeedBack(buffer)
      if (!index) {
        this._backupObj[messageId].firstInterval = interval
      } else {
        this._backupObj[messageId].lastInterval = interval
      }
    } else {
      this.sendQueue.push(buffer)
      this._packover()
    }
  }
  _backup(buffer, index, messageId) {
    if (!this._backupObj[messageId]) {
      this._backupObj[messageId] = { buffers: {} }
    }
    this._backupObj[messageId].buffers[index] = buffer
  }
  async _packover() {
    if (this._sendStart) {
      return
    }

    this._sendStart = true
    for (let i = 0; i < this.sendQueue.length; ) {
      const data = await this.sendQueue.shift()
      this.emit('packover', data)
    }
    this._sendStart = false
  }
  _sendUntilFeedBack(data) {
    this.sendQueue.unshift(data)
    this._packover()

    return setInterval(() => {
      this.sendQueue.unshift(data)
      this._packover()
    }, 5000)
  }

  emit(key, ...data) {
    console.log(this, key,data, this._events[key])
    if (this._events[key]) {
      this._events[key].forEach(it => it(...data))
    }
    return this
  }

  on(key, fn) {
    if (!this._events[key]) {
      this._events[key] = []
    }
    this._events[key].push(fn)
    return this
  }
}
