import { setHeader, toBlob, getType } from '../tool'
export default class Packer {
  _queue = []
  _isNoDataYield = 1
  chunkSize = 1024 * 64
  setChunkSize(chunkSize) {
    this.chunkSize = chunkSize || this.chunkSize
  }
  next() {
    if (!this._isNoDataYield) {
      this.y.next()
    }
  }
  pack(data) {
    const info = { data }

    const back = function(progress) {
      info.p = progress
    }
    this._queue.push(info)

    Promise.resolve().then(() => {
      if (!this.y) {
        this.y = this._slice()
        this.y.next()
      } else if (this._isNoDataYield) {
        this.y.next()
      }
    })

    return back
  }
  *_slice() {
    while (true) {
      if (!this._queue.length) {
        this._isNoDataYield = 1
        yield
        continue
      }
      this._isNoDataYield = 0

      let dataInfo = this._queue.shift()
      if (dataInfo.data.length > 3) {
        throw new Error('only 3 args are allowed: emit(string,data,desc)')
      }

      const [eventKey, value, desc] = dataInfo.data

      let valueBlob = new Blob()
      if (value) {
        valueBlob = toBlob(value)
      }

      const headerExtens = {
        total: valueBlob.size,
        type: getType(value),
        eventKey
      }
      if (desc) {
        headerExtens.desc = desc
      }
      const headerBuffer = setHeader(headerExtens)

      let blob = new Blob([headerBuffer, valueBlob])
      headerExtens.sendSize = 0
      while (blob.size) {
        let fragmentBlob = blob.slice(0, this.chunkSize)
        if (!headerExtens.sendSize) {
          const delHeaderBufferLeftbuffer =
            fragmentBlob.size - headerBuffer.byteLength
          headerExtens.sendSize =
            delHeaderBufferLeftbuffer > 0 ? delHeaderBufferLeftbuffer : 0
        } else {
          headerExtens.sendSize += fragmentBlob.size
        }
        console.log('progress')
        this.onprogress(fragmentBlob, headerExtens)
        const p = dataInfo.p
        p && p(headerExtens)
        if (!blob.size) {
          this.onpackover(headerExtens)
          break
        }
        yield
        blob = blob.slice(this.chunkSize)
      }
    }
  }
}
