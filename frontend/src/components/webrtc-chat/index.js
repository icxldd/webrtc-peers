import DataTrans from './data-trans'
import DC from './dc-manager'
import { EventEmitter, getByte } from './tool'
export default class WebRTCChart extends EventEmitter {
  sendQueue = []
  constructor(pc) {
    super()
    this.dcManager = new DC(pc)

    this.trans = new DataTrans()

    this.dcManager.on('message', data => this.trans.unpack(data))

    this.trans
      .on('packover', this._beforeSend.bind(this))
      .on('unpackover', this._unpackover.bind(this))
      .on('progress', this.progress.bind(this))
  }
  _unpackover(data) {
    this.emit('message', data)
  }
  _beforeSend(data) {
    this.sendQueue.push(data)
    this._sendg = this._sendg || this._send()
    this._sendg.next()
  }
  progress(header) {
    if (!window[header.messageId]) {
      window[header.messageId] = Date.now()
    }
    let time = (Date.now() - window[header.messageId]) / 1000
    let speed = header.getByte / 1024 ** 2 / time
    console.log(
      'progress',
      header.messageId,
      (header.getByte * 100) / header.total,
      time,
      speed + 'Mb/s',
      header
    )
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
  _sendUntilFeedBack(data) {
    this.sendQueue.unshift(data)
    this._sendg.next()
    return setInterval(() => {
      this.sendQueue.unshift(data)
      this._sendg.next()
    }, 5000)
  }
}
