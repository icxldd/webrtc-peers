import pack from './pack.js'
import unpack from './unpack.js'
import { encode, randomStr, EventEmitter } from '../tool'
export default class DataTrans extends EventEmitter {
  _backupObj = {}
  unpack = unpack
  constructor(config) {
    super()

    this.chunkByteLength = config && config.chunkByteLength
    unpack.onmessage = data => {
      this.emit('unpackover', data)
    }
    unpack.onnotice = this._notice.bind(this)
    unpack.onfeedback = this._feedback.bind(this)
    unpack.onunpackprogress = this._onunpackprogress.bind(this)
    unpack.onprogress = this._onpackprogress.bind(this)

    pack.onmessage = this._getPackeddata.bind(this)
  }
  pack(val) {
    const messageId = randomStr()
    pack(val, messageId, this.chunkByteLength)
    return messageId
  }
  clear() {}
  /**
   *
   * @param {string} messageId
   * @param {0:收到首条数据,1:收到尾条数据,2:丢失信息重发,9：收到完整信息} type
   */
  _notice(data) {
    const sendBuffer = encode(`%${JSON.stringify(data)}`)
    this._packover(sendBuffer)
  }
  /**
   * 通知信息的反馈
   * @param { messageId, type, lack} data
   */
  _feedback({ messageId, type, lack }) {
    if (!this._backupObj[messageId]) {
      return
    }
    console.log('feedback', messageId, type, lack)
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
      lack.forEach(it => {
        buffersBack[it] = buffers[it]
        this._packover(buffersBack[it])
      })
      this._backupObj[messageId].buffers = buffersBack
    }
  }
  _onpackprogress(header) {
    this.emit('progress', header)
  }
  _onunpackprogress(header) {
    this.emit('progress', header)
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
      this._packover(buffer)
    }
  }
  _backup(buffer, index, messageId) {
    if (!this._backupObj[messageId]) {
      this._backupObj[messageId] = { buffers: {} }
    }
    this._backupObj[messageId].buffers[index] = buffer
  }
  async _packover(data) {
    data  = await data
    this.emit('packover', data)
  }
  _sendUntilFeedBack(data) {
 
    this._packover(data)

    return setInterval(() => {
      this._packover(data)
    }, 5000)
  }
}
