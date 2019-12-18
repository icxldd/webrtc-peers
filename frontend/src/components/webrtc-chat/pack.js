import { setHeader, randomStr, getByte } from './tool'
/**
 *
 * @param {Array} data
 * @returns {Array[{index,buffer}]}
 */
export default async function pack(data) {
  const messageId = randomStr()
  data = await Promise.all(data.map(getByte))
  const argsTypes = data.map(it => it.type)
  const argsLens = data.map(it => it.buffer.byteLength)

  let blob = new Blob(data.map(it => it.buffer))

  let index = 0

  const chunkLen = 1024 * 16

  const cutData = { messageId }

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
    cutData[index] = await new Blob([headerBuffer, contentBuffer]).arrayBuffer()
    blob = blob.slice(freeLen)
    index++
  }

  return cutData
}
