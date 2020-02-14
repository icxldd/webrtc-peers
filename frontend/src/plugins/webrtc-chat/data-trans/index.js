import Packer from './packer.js'
import Unpacker from './unpacker.js'
import { encode, randomStr, EventEmitter, reader } from '../tool'
export default class DataTrans extends EventEmitter {
  constructor(config) {
    super()
    this.unpacker = new Unpacker()
    this.unpacker.onunpackover = (eventKey, data, desc) =>
      this.emitLocal('unpackover', eventKey, data, desc)
    this.unpacker.onprogress = (eventKey, buffer, header) =>
      this.emitLocal('unpackprogress', eventKey, buffer, header)

    this.packer = new Packer(config)
    this.packer.onpackover = header => this.emitLocal('packover', header)

    this.packer.onprogress = (data, header) =>
      this.emitLocal('packprogress', data, header)
    this.setChunkSize = val => this.packer.setChunkSize(val)

    // 打包后完整数据格式: headerlen,header content
  }
}
