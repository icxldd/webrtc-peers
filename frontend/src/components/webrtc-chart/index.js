import DataTrans from '../datachannel-transform'

export default class WebRTCChart {
  sendQueue = []
  _events = {}
  constructor(dc) {
    this.trans = new DataTrans()
    dc.binaryType = 'arraybuffer'
    dc.addEventListener(
      'message',
      e => {
        this.trans.unpack(e.data)
      },
      false
    )
    this.dc = dc

    this.trans
      .on('packover', this._beforeSend.bind(this))
      .on('unpackover', this.onmessage.bind(this))

    this.dealWithDc()
  }
  onmessage(val) {
    this.emit('message', val)
  }
  _beforeSend(data) {
    this.sendQueue.push(data)
    this._send()
  }

  dealWithDc() {
    this.dc.onopen = async () => {
      // this.dc.readyState === 'open'
      console.log('type')
      this._send()
    }
  }

  async send(...data) {
    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }

    return this.trans.pack(data)
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
  _sendUntilFeedBack(data) {
    this.sendQueue.unshift(data)
    this._send()

    return setInterval(() => {
      this.sendQueue.unshift(data)
      this._send()
    }, 5000)
  }

  emit(key, ...data) {
    console.log(this, key, data, this._events[key])
    if (this._events[key]) {
      this._events[key].forEach(it => it(...data))
    }
    return this
  }

  on(key, fn) {
    if (!this._events[key]) {
      this._events[key] = []
    }
    this._events[key].push(fn)
    return this
  }
}
