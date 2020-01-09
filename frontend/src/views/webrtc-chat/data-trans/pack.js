import { setHeader, getByte, mergeBuffer, reader } from '../tool'
/**
 *
 * @param {Array} data
 * @packedData {buffer, index, messageId}
 */
let _queue = [],
  y,
  yieldPosition
export default async function pack(data, chunkLen = 1024 * 64) {
  _queue.push(data)
  if(!y) {
    y = _pack()
    y.next()
  } else if(yieldPosition){
    y.next()
  }
}

pack.next = function() {
  y.next()
}

async function* _pack() {
  while (true) {
    console.log('chunklen', chunkLen)
    if (!_queue.length) {
      yieldPosition = 0
      yield 
      continue
    }
    yieldPosition = 1

    let orgData = _queue.shift()
    const data = await Promise.all(orgData.map(getByte))

    const argsTypes = data.map(it => it.type)
    const argsLens = data.map(it => it.buffer.byteLength)

    let blob = new Blob(data.map(it => it.buffer))
    let i = 0
    while (blob.size) {
      let headerBuffer
      if (!i) {
        headerBuffer = setHeader({
          // 需要拆分数据的头一个header
          total: blob.size,
          argsTypes,
          argsLens
        })
        i = 1
      }

      let freeLen = headerBuffer ? chunkLen - headerBuffer.byteLength : chunkLen
      let contentBuffer = blob.slice(0, freeLen)
      const buffer = await reader.readAsArrayBuffer(
        new Blob([headerBuffer, contentBuffer])
      )
      pack.onpackover(buffer)
      yield 1
      blob = blob.slice(freeLen)
    }
  }
}
