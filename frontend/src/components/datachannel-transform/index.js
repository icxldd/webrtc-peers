import pack from './pack.js'
import unpack from './unpack.js'
import { encode } from './tool'
export default class WebRtcChat {
  sendQueue = []
  _backupObj = {}
  constructor(dc) {
    dc.binaryType = 'arraybuffer'
    dc.addEventListener(
      'message',
      e => {
        unpack(e.data)
      },
      false
    )

    unpack.onmessage = this._getUnpackData.bind(this)
    unpack.onnotice = this._notice.bind(this)
    unpack.onfeedback = this._feedback.bind(this)
    
    pack.onmessage = this._getPackeddata.bind(this)
    this.dc = dc
    this.dealWithDc()
  }

  dealWithDc() {
    this.dc.onopen = async _ => {
      await new Promise(resolve => {
        const interval = setInterval(_ => {
          if (this.dc.readyState === 'open') {
            resolve()
            clearInterval(interval)
          }
        }, 100)
      })

      this._send()
    }
  }
  /**
   *
   * @param {string} messageId
   * @param {0:收到首条数据,1:收到尾条数据,2:丢失信息重发,9：收到完整信息} type
   */
  _notice(data) {
    const sendBuffer = encode(`%${JSON.stringify(data)}`)
    this.sendQueue.push(sendBuffer)
    this._send()
  }
  /**
   * 通知信息的反馈
   * @param { messageId, type, lack} data
   */
  _feedback({ messageId, type, lack }) {
    if (!this._backupObj[messageId]) {
      return
    }
    console.log('feed', messageId, type,lack)
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
  _getUnpackData(data) {
    this.onmessage(data)
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
      this._send()
    }
  }
  _backup(buffer, index, messageId) {
    if (!this._backupObj[messageId]) {
      this._backupObj[messageId] = { buffers: {} }
    }
    this._backupObj[messageId].buffers[index] = buffer
  }
  async send(...data) {
    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }
    pack(data)
  }
  async _send() {
    if (this._sendStart || this.dc.readyState !== 'open') {
      return
    }

    this._sendStart = true
    for (let i = 0; i < this.sendQueue.length; ) {
      const data = await this.sendQueue.shift()
      this.dc.send(data)
    }
    this._sendStart = false
  }
  _sendUntilFeedBack(data) {
    this.sendQueue.unshift(data)
    this._send()

    return setInterval(() => {
      this.sendQueue.unshift(data)
      this._send()
    }, 5000)
  }
}
