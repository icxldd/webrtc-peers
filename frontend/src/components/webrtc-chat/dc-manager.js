import { EventEmitter, randomStr } from './tool'
export default class DC extends EventEmitter {
  dcs = []
  constructor(pc, config) {
    super()
    this.pc = pc
    window.dcs = this

    this.config = Object.assign({ maxCount: 5 }, config)
    pc.ondatachannel = e => {
      const dc = e.channel
      this._dcEventHandler(dc)
    }
    this._create({ negotiated: true, id: 0 })
  }
  _create(config) {
    const defaultConfig = {
      ordered: false
    }
    Object.assign(defaultConfig, config)
    const dc = this.pc.createDataChannel(
      'channel-webrtc-chat',
      defaultConfig
    )
    console.log('dc', dc)
    this._dcEventHandler(dc)
  }

  _dcEventHandler(dc) {
    dc.binaryType = 'arraybuffer'

    dc.addEventListener('message', e => {
      this.emit('message', e.data)
    })
    dc.addEventListener('open', () => {
      this.dcs.push(dc)
      this._noticeNewDc(dc)
    })

    dc.addEventListener('bufferedamountlow', () => {
      this._noticeNewDc(dc)
    })

    dc.addEventListener('error', () => this._del(dc))
    dc.addEventListener('close', () => this._del(dc))
  }
  _deleteDynamically(dc) {
    if (dc.id === 0) return // 始终保持一个
    clearTimeout(dc.timeout)
    dc.timeout = setTimeout(() => {
      dc.close()
      this._del(dc)
    }, 10 * 1000)
  }
  _noticeNewDc(dc) {
    if (dc.readyState !== 'open') return
    this._preferredDcChange && this._preferredDcChange(dc)
    this._preferredDcChange = null
  }
  async send(data) {
    const dc = await this._findPreferredDc()
    dc.send(data)
  }

  async _findPreferredDc() {
    let pickDc = null
    for (let i = 0; i < this.dcs.length; i++) {
      let dc = this.dcs[i]
      if (dc.readyState !== 'open') continue
      if (dc.bufferedAmount === 0) {
        return dc
      }
      if (!pickDc) pickDc = dc

      if (dc.bufferedAmount < pickDc.bufferedAmount) {
        pickDc = dc
      }
    }
    if (pickDc.bufferedAmount >= 1024 ** 2) {
      if (this.dcs.length < this.config.maxCount) {
        this._create()
      }
      return new Promise(r => (this._preferredDcChange = r))
    }
    return pickDc
  }
  _del(dc) {
    this.dcs = this.dcs.filter(it => it !== dc)
  }
}
