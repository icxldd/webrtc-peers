import { EventEmitter, randomStr, isBuffer, reader } from './tool'
import DataTrans from './data-trans'

export default class DCManger {
  constructor(pc, chat) {
    this.pc = pc
    this.chat = chat
    this.dcfile = new DC(pc, 1)
    this.handelTransEvent(this.dcfile)

    this.dcdata = new DC(pc, 2)
    this.handelTransEvent(this.dcdata)
  }
  handelTransEvent(dc) {
    dc.trans
      .on('unpackprogress', (eventKey, buffer, progressHeader) => {
        this.chat.onprogress &&
          this.chat.onprogress({ eventKey, buffer, ...progressHeader })
      })
      .on('unpackover', (eventKey, data, desc) => {
        this.chat.onmessage && this.chat.onmessage({ eventKey, data, desc })
        console.log('get', eventKey, data, desc)
        this.chat.emitLocal(eventKey, data, desc)
      })
  }

  send(key, data, header) {
    if (typeof key !== 'string') {
      throw new Error('emit key must be String')
    }
    if (isBuffer(data)) {
      return this.dcfile.send(key, data, header)
    } else {
      return this.dcdata.send(key, data, header)
    }
  }
}

class DC {
  constructor(pc, id) {
    this.dc = pc.createDataChannel('webrtc-chat', {
      negotiated: true,
      id
    })
    this._dcEventHandler(this.dc)
    this.trans = new DataTrans()
    this.trans.on('packprogress', this._onpackprogress.bind(this)) // (blob,header)
  }
  async _onpackprogress(blob, header) {
    const buff = await reader.readAsArrayBuffer(blob)
    this.dc.send(buff)

    await new Promise(r => (this.lowBuffer = r))

    this.trans.packer.next()
  }
  _dcEventHandler(dc) {
    dc.binaryType = 'arraybuffer'

    dc.addEventListener('message', e => {
      this.trans.unpacker.unpack(e.data)
    })
    dc.addEventListener('open', () => {})

    dc.addEventListener('bufferedamountlow', () => {
      this.lowBuffer && this.lowBuffer()
    })

    dc.addEventListener('error', () => this._del(dc))
    dc.addEventListener('close', () => this._del(dc))
  }
  send(...data) {
    return this.trans.packer.pack(data)
  }
}
