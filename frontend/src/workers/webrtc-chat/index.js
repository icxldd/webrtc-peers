import PackWorker from './pack.worker.js'
import UnpackWorker from './unpack.worker.js'

export default class WebRtcChat {
  sendQueue = []
  constructor(dc) {
    dc.binaryType = 'arraybuffer'
    dc.addEventListener('message', e => this.unpackWorker.postMessage(e.data), false)
    this.dc = dc
    this.packWorker = new PackWorker()
    this.unpackWorker = new UnpackWorker()
    this.packWorker.onmessage = e => this.onPackWorkerMessage(e.data)
    this.unpackWorker.onmessage = e => this.onUnpackWorkerMessage(e.data)
  }

  async pack(data) {
    this.packWorker.postMessage(data)
  }

  async onPackWorkerMessage(data) {
    this.sendQueue.push(data)
    this._send()
  }



  onUnpackWorkerMessage(data) {
    if (this.onmessage) {
      this.onmessage(data)
    }
  }

  async send(...data) {
    if (this.dc.readyState !== 'open') {
      throw new Error('datachannel readyState is not open')
    }
    this.packWorker.postMessage(data)
  }

  async _send() {
    if (this._sendStart) return
    this._sendStart = true
    for (let i = 0; i < this.sendQueue.length;) {
      this.dc.send(this.sendQueue.shift())
      await new Promise(setTimeout)
    }
    this._sendStart = false
  }

}
