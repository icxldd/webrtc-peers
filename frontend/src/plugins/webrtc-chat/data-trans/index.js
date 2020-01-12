import Packer from './packer.js'
import Unpacker from './unpacker.js'
import { encode, randomStr, EventEmitter ,reader} from '../tool'
export default class DataTrans extends EventEmitter {

  constructor(config) {
    super()
    this.unpacker = new Unpacker()
    this.unpacker.unpackover = data => this.emit('unpackover', data)
    this.unpacker.onprogress = mess=> this.emit('unpackprogress', mess)

    this.packer = new Packer()
    this.packer.onpackover = this._packover.bind(this)
    this.packer.onprogress = mess => this.$emit('packprogress', mess)
  }
  async _packover(blob,headers) {
    const data  = await reader.readAsArrayBuffer(blob)
    this.emit('packover', data,headers)
  }
}
