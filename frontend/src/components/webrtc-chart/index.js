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
      .on('progress', this.progress.bind(this))
    this.dc.onopen = async () => {
      this._sendg = this._sendg || this._send()
    }
    this.dc.bufferedAmountLowThreshold = 1024 * 64
    this.dc.onbufferedamountlow = () => {
      console.log('low',this.dc.bufferedAmount)
      this._sendg.next()
    }
  }
  onmessage(val) {
    this.emit('message', val)
  }
  _beforeSend(data) {
    this.sendQueue.push(data)
    this._sendg = this._sendg || this._send()
    this._sendg.next()
  }
  progress(header) {
    console.log('pheader',header)
  }

  async send(...data) {
    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }

    return this.trans.pack(data)
  }

  *_send() {
    while (true) {
      if (this.dc.bufferedAmount > 1024 * 64 * 3 ) {
        console.log('too large', this.dc.bufferedAmount)
        yield
        continue
      }
      if(!this.sendQueue.length) {
        console.log('nodata',this.dc.bufferedAmount)
        yield
        continue
      }

      if (this.sendQueue.length) {
        this.dc.send(this.sendQueue.shift())
        console.log('send')
      }
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
