import {
  parseHeader,
  blobToData,
  mergeBuffer
} from '../tool'

export default class Unpacker {
  message = null
  unpack(buffer) {
    if (!this.message) {
      this.message = {
        buffer: new Uint8Array(),
        blob: new Blob()
      }
    }

    if (!this.message.desc) {
      this.message.buffer = mergeBuffer(this.message.buffer, buffer)
      const { header, leftBuffer } = parseHeader(this.message.buffer)
      if (!header) { // {header: obj, total}
        return
      }
      buffer = leftBuffer
      this.message.getBytes = 0
      this.message.desc = header.header
      this.message.total = header.total
      Reflect.deleteProperty(this.message, 'buffer')
    }

    this.message.getBytes += buffer.byteLength
    this.message.blob = new Blob([this.message.blob, buffer])

    this.onprogress(this.message)

    if (this.message.getBytes === this.message.total) {
      let desc = this.message.desc
      blobToData(blob).then(res => {
        res.push(desc)
        console.log('packover', res)
        this.onunpackover(res)
      })
      this.message = null
    }
  }
}
