import { setHeader, getByte, mergeBuffer, reader } from './tool'
/**
 *
 * @param {Array} data
 * @packedData {buffer, index, messageId}
 */
export default async function pack(data,messageId) {

  data = await Promise.all(data.map(getByte))

  const argsTypes = data.map(it => it.type)
  const argsLens = data.map(it => it.buffer.byteLength)

  let blob = new Blob(data.map(it => it.buffer))

  let index = 0

  const chunkLen = 1024 * 64

  while (blob.size) {
    let header
    if (!index) {
      header = {
        // 需要拆分数据的头一个header
        index,
        messageId,
        total: blob.size,
        argsTypes,
        argsLens
      }
    } else {
      header = {
        // 中间数据的header
        index,
        messageId
      }
    }
    let headerBuffer = setHeader(header)
    if (blob.size + 8 <= chunkLen - headerBuffer.byteLength) {
      header.fin = 1
      headerBuffer = setHeader(header)
    }

    let freeLen = chunkLen - headerBuffer.byteLength
    let contentBuffer = blob.slice(0, freeLen)
    const buffer = await reader.readAsArrayBuffer(new Blob([headerBuffer, contentBuffer]))
    pack.onmessage(buffer, index, messageId, header.fin)
    blob = blob.slice(freeLen)
    index++
  }
}
