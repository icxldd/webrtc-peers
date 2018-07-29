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
    if (this.sendQueue.length !== 1) {
      return
    }

    for (let i = 0; i < this.sendQueue.length;) {
      let aa = this.sendQueue.shift()
      console.log(aa)
      this.dc.send(aa)
      await new Promise(res => setTimeout(res))
    }


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

}
