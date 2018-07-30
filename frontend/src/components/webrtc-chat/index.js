import pack from './pack.js'
import unpack from './unpack.js'

export default class WebRtcChat {
  sendQueue = []
  constructor(dc) {
    dc.binaryType = 'arraybuffer'
    dc.addEventListener('message', e => unpack.merge(e.data), false)
    unpack.onmessage = data => this.onmessage && this.onmessage(data)
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

  async send(...data) {
    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }
    const packdata = pack(data)
    this.sendQueue.push(packdata)

    if (this.dc.readyState !== 'open') {
      throw new Error('datachannel readyState is not open')
    }

    this._send()
  }
  async _send() {
    if (this._sendStart) {
      return
    }

    this._sendStart = true
    for (let i = 0; i < this.sendQueue.length;) {
      const data = await this.sendQueue.shift()

      for (let j = 0; j < data.length; j++) {
        this.dc.send(data[j])
        await new Promise(window.setTimeout)
      }
    }
    this._sendStart = false
  }

}
