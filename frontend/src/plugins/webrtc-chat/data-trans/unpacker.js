import { parseHeader, mergeBuffer,reader } from '../tool'

export default class Unpacker {
  message = null
  async unpack(buffer) {
    if (!this.message) {
      this.message = {
        buffer: new Uint8Array(),
        blob: new Blob()
      }
    }
    if (!this.message.header) {
      this.message.buffer = mergeBuffer(this.message.buffer, buffer)
      const { header, leftbuffer } = parseHeader(this.message.buffer)
      if (!header) {
        // {header: obj, total}
        return
      }
 
      buffer = leftbuffer
      this.message.header = header
      header.getBytes = 0
      Reflect.deleteProperty(this.message, 'buffer')
    }
    const header = this.message.header
    header.getBytes += buffer.byteLength
    const {eventKey,...progressHeader} = header
    this.onprogress(eventKey, buffer, progressHeader)
    this.message.blob = new Blob([this.message.blob, buffer])

    if (header.getBytes === header.total) {
      const blob = this.message.blob
      this.message = null

      const type = header.type
      let data
      if (['Blob', 'File'].includes(type)) {
        data = blob
      } else if (type === 'ArrayBuffer') {
        data = await reader.readAsArrayBuffer(blob)
      } else if (type === 'undefined') {
        data = undefined
      } else if (type === 'null') {
        data = null
      } else {
        const str = await reader.readAsText(blob)
        data = JSON.parse(str)
      }
      this.onunpackover(eventKey, data, header.desc)
    }
  }
}
