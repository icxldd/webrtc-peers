import { setHeader, dataToBlob, EventEmitter } from '../tool'
export default class Packer extends EventEmitter{
  _queue = []
  _isNoDataYield = 1
  chunkSize=1024* 64
  constructor(chunkSize) {
    this.chunkSize = chunkSize || this.chunkSize
  }
  pack(data) {
    this._queue.push(data)
    if (!this.y) {
      this.y = this._slice()
      this.y.next()
    } else if (this._isNoDataYield) {
      this.y.next()
    }
  }
  * _slice () {
  
    while (true) {
      if (!this._queue.length) {
        this._isNoDataYield = 1
        yield
        continue
      }
      this._isNoDataYield = 0
  
      let orgData = this._queue.shift()
      if (orgData.length > 3) {
        throw new Error('only 3 args are allowed: emit(key,value,header)')
      }
      const [key, value, header] = orgData

      if (getType(header) !== 'Object') {
        throw new Error('header must be object')
      }
  
      const contentBlob = dataToBlob([key, value])
      const headerExtens = {total: contentBlob.size}
      if(header) {
        headerExtens.header = header
      }
      const headerBuffer = setHeader(headerExtens)
      
      let blob = new Blob([headerBuffer, contentBlob])
      headerExtens.packedSize = 0
      while (blob.size) {
        let fragmentBlob = blob.slice(0, chunkSize)
        headerExtens.packedSize +=fragmentBlob.size
        this.onprogress(fragmentBlob, headerExtens)
        yield
        blob = blob.slice(chunkSize)
      }
      this.onpackover(headerExtens)
    }
  }

}
