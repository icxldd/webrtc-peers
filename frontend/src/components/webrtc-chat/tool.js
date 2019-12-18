const de = new TextDecoder()
const en = new TextEncoder()

export const decode = de.decode.bind(de)
export const encode = en.encode.bind(en)

export const randomStr = function(len) {
  len = len || 32
  let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz234567890_'
  let maxPos = $chars.length
  let str = ''
  for (let i = 0; i < len; i++) {
    str += $chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return str
}
export const types = {
  String: 1,
  Object: 2,
  Arraybuffer: 3,
  Boolean: 4,
  Number: 5,
  Blob: 6
}

export const getType = function(val) {
  const toString = Object.prototype.toString
  return toString.call(val).slice(8, -1)
}
/**
 * @param {index  Number}
 * @param {messageId  String}
 * @param {total  Number}
 * @param {argsTypes  array}
 * @param {argsLens  array}
 * index为0 时包含很多所有信息，不为0 时只包含index和messageId信息
 * @return buffer 1234,header content。其中1234表示header区域长度为1234，以逗号为分界线
 */

export const setHeader = function(header) {
  let s = JSON.stringify(header)
  let buffer = encode(s)
  return encode(`${buffer.byteLength},${s}`)
}

export const parseFragment = function(buffer) {
  buffer = new Uint8Array(buffer)

  let lenBufferIndex = buffer.indexOf(44) // 44为,
  const headerLen = +decode(buffer.subarray(0, lenBufferIndex))

  const headerBuffer = buffer.subarray(
    lenBufferIndex + 1,
    headerLen + lenBufferIndex + 1
  )
  return {
    header: JSON.parse(decode(headerBuffer)),
    content: buffer.subarray(headerLen + lenBufferIndex + 1)
  }
}

export const getByte = async function(it) {
  const type = getType(it)

  let buffer
  if (type === 'String') {
    buffer = encode(it)
  } else if (type === 'Blob') {
    buffer = await it.arrayBuffer()
  } else if (type === 'ArrayBuffer') {
    buffer = it
  } else if (type === 'Boolean') {
    buffer = new Uint8Array([it])
  } else if (type === 'Number') {
    buffer = encode(it)
  } else if (type === 'Object' || type === 'Array') {
    buffer = await new Blob([JSON.stringify(it)]).arrayBuffer()
  }
  return {
    type: types[type], // 转换成1，2，3等
    buffer
  }
}
