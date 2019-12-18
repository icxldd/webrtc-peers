import pack from './pack.js'
import unpack from './unpack.js'

export default class WebRtcChat {
  sendQueue = []
  _backup = {}
  constructor(dc) {
    dc.binaryType = 'arraybuffer'
    dc.addEventListener(
      'message',
      e => {
        unpack.merge(e.data)
      },
      false
    )
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
    const { messageId, ...obj } = await pack(data)
    
    this._backup[messageId] = obj

    this.sendQueue.push(...Object.values(obj))
    window.c = this
    this._send()
  }
  async _send() {
    if (this._sendStart || this.dc.readyState !== 'open') {
      return
    }

    this._sendStart = true
    for (let i = 0; i < this.sendQueue.length; ) {
      const data = await this.sendQueue.shift()
      this.dc.send(data)
    }
    this._sendStart = false
  }
}
