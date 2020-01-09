import Packer from './packer.js'
import unpack from './unpack.js'
import { encode, randomStr, EventEmitter } from '../tool'
export default class DataTrans extends EventEmitter {
  unpack = unpack
  pack = pack
  constructor(config) {
    super()

    unpack.unpackover = data => {
      this.emit('unpackover', data)
    }
    unpack.onunpackprogress = this._onunpackprogress.bind(this)
    unpack.onprogress = this._onpackprogress.bind(this)


    this.packer = new Packer()
    this.packer.onpackover = this._getPackeddata.bind(this)
  }

  _onpackprogress(header) {
    this.emit('progress', header)
  }
  _onunpackprogress(header) {
    this.emit('progress', header)
  }
  _getPackeddata(blob, header) {
  
    this._packover(buffer)
    
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
}
