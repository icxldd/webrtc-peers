import Datachannel from './datachannel'
import { EventEmitter } from './tool'
export default class WebRTCChart extends EventEmitter {
  sendQueue = []
  datachannels = {}
  constructor(pc) {
    super()
    this.pc = pc
    pc.createDatachannel
    this.pc.ondatachannel = e => {

    }
  }
  _create() {
    const dc = new Datachannel(this.pc)
    this.datachannels[channel] = dc
    return dc
  }
  to(label) {
    return this.datachannels[label]
  }

  _dcEventHandler(dc) {
    dc.binaryType = 'arraybuffer'

    dc.addEventListener('message', e => {
      this.emit('message', e.data)
    })
    dc.addEventListener('open', () => {})

    dc.addEventListener('bufferedamountlow', () => {})

    dc.addEventListener('error', () => this._del(dc))
    dc.addEventListener('close', () => this._del(dc))
  }
  _del(dc) {
    Reflect.deleteProperty(this.datachannels, dc.label)
  }
  _onpackprogress(buffer, desc) {
    this.emit('progress', desc)
  }
  _unpackprogress(data, desc) {
    this.emit('progress', data, desc)
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
}
