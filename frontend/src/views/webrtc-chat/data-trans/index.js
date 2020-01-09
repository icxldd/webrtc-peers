import pack from './pack.js'
import unpack from './unpack.js'
import { encode, randomStr, EventEmitter } from '../tool'
export default class DataTrans extends EventEmitter {
  _backupObj = {}
  unpack = unpack
  constructor(config) {
    super()

    this.chunkByteLength = config && config.chunkByteLength
    unpack.unpackover = data => {
      this.emit('unpackover', data)
    }
    unpack.onunpackprogress = this._onunpackprogress.bind(this)
    unpack.onprogress = this._onpackprogress.bind(this)

    pack.onpackover = this._getPackeddata.bind(this)
  }
  pack(val) {
    const messageId = randomStr()
    pack(val,this.chunkByteLength)
  }
  clear() {}
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
