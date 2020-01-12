import { EventEmitter, randomStr, } from './tool'
import DataTrans from './data-trans'

export default class DC extends EventEmitter {

  constructor(pc) {
    super()
    if()
    pc.create
    this.trans = new DataTrans()

    this.trans
      .on('packprogress', this._onpackprogress.bind(this))
      .on('unpackprogress', this._unpackprogress.bind(this))
      .on('unpackover', this._onpackover.bind(this))
  }

  async send(...data) {
    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }

    return this.trans.pack(data)
  }

  async *_send() {
    while (true) {
      if (!this.sendQueue.length) {
        yield
        continue
      }

      const data = this.sendQueue.shift()
      console.log('send', data, this.sendQueue.length)
      await this.dcManager.send(data)
    }
  }

}
