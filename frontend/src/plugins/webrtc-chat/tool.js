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
  Arraybuffer: 1,
  Blob: 2,
  undefined: 3,
  null: 4,
  Object: 5,
  Array: 6,
  Number:7,
}

export const getType = function(val) {
  if (val && val.buffer && val.buffer instanceof ArrayBuffer || val instanceof ArrayBuffer) {
    return 'ArrayBuffer'
  }
  const toString = Object.prototype.toString
  return toString.call(val).slice(8, -1)
}
/**
 * @param {header  JSON}
 */

export const setHeader = function(header) {
  let s = JSON.stringify(header)
  let buffer = encode(s)
  return encode(`${buffer.byteLength},${s}`)
}

// strbuffer -> "1000," 返回1000
export const getDescByteLen = function(buffer) {
  buffer = new Uint8Array(buffer)

  let lenBufferIndex = buffer.indexOf(44) // 44为,
  if (lenBufferIndex === -1) {
    return {
      descByteLen: -1,
      leftbuffer: buffer
    }
  }
  return {
    descByteLen: +decode(buffer.subarray(0, lenBufferIndex)),
    leftbuffer: buffer.subarray(lenBufferIndex + 1)
  }
}
export const parseHeader = function(buffer) {
  buffer = new Uint8Array(buffer)
  
  let { descByteLen, leftbuffer } = getDescByteLen(buffer)
  if (descByteLen === -1 || leftbuffer.byteLength < descByteLen) {
    return {
      header: null,
      leftbuffer
    }
  }

  const headerBuffer = leftbuffer.subarray(0, descByteLen)
  let header = JSON.parse(decode(headerBuffer))

  return {
    header,
    leftbuffer: leftbuffer.subarray(descByteLen)
  }
}

export const mergeBuffer = function(...datas) {
  let len = 0
  for (let it of datas) {
    if (getType(it) !== 'ArrayBuffer') {
      throw new Error(`mergebuffer args must be buffer`)
    }
    len += it.byteLength
  }
  let result = new Uint8Array(len)
  let offset = 0
  for (let it of datas) {
    if (!(it instanceof Uint8Array)) {
      it = new Uint8Array(it)
    }
    result.set(it, offset)
    offset += it.byteLength
  }
  return result
}
export const isBuffer =  function(data) {
  const t = getType(data)
  return ['Blob', 'ArrayBuffer', 'File'].includes(t)
}
/**
 *
 * @param {object} obj
 * @return {Blob} 1100,[obj,record]buffers' 其中1100[obj,record]所占的长度
 */

export function toBlob(data) {
  const type = getType(data)
  if (type === 'ArrayBuffer') {
    return new Blob([data])
  } else if (type === 'Blob') {
    return data
  } else {
    return new Blob([JSON.stringify(data)])
  }
}
export async function BlobtoData(blob) {
  

  let arrStr = await reader.readAsText(objBlob)
}

export const reader = new Proxy(
  {},
  {
    get(target, property) {
      const reader = new FileReader()
      return function(val) {
        reader[property](val)
        return new Promise(r => {
          reader.onload = e => r(e.target.result)
        })
      }
    }
  }
)

export class EventEmitter {
  _events = {}
  emitLocal(key, ...data) {
    if (this._events[key]) {
      this._events[key].forEach(it => it(...data))
    }
    return this
  }

  on(key, fn) {
    if (!this._events[key]) {
      this._events[key] = []
    }
    this._events[key].push(fn)
    return this
  }

  off(key, fn) {
    if (!this._events[key]) {
      return false
    }
    if (!fn) {
      return (this._events[key] = null)
    }

    this._events[key] = this._events[key].filter(it => it !== fn)
    return this
  }
}
