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
  Array: 6
}

export const getType = function(val) {
  if (val && val.buffer && val.buffer instanceof ArrayBuffer) {
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
    if (getType(it) !== 'AarrayBuffer') {
      throw new Error(`mergebuffer args must be buffer`)
    }
    len += it.byteLength
  }
  let result = new Uint8Array(len)
  let offset = 0
  for (let it of datas) {
    if (!(it instanceof Uint8Array)) {
      it = new Uint8Array(it.buffer)
    }
    result.set(it, offset)
    offset += it.byteLength
  }
  return result
}

/**
 *
 * @param {object} obj
 * @return {Blob} 1100,[obj,record]buffers' 其中1100[obj,record]所占的长度
 */

export  function dataToBlob(obj) {
  let record = [], // [['a.b.c', 2341334]]
    buffers = [], //[buffer]
    nwObj = {}
  obj = { _: obj }
 
  function start(obj, nwObj, path = []) {
    for (let key in obj) {
      let val = obj[key],
        keypath = [...path, key].join('.'),
        type = getType(val)

      if (getType(val) === 'ArrayBuffer') {
        record.push([keypath, `1, ${val.byteLength}`])
        buffers.push(val)
        continue
      }
      if (val instanceof Blob) {
        record.push([keypath, `2, ${val.size}`])
        buffers.push(val)
        continue
      }
      
      if (type === 'Array') {
        nwObj[key] = []
        start(val, [...path, key])
      } else if (type === 'Object') {
        nwObj[key] = Object.create(null)
      } else {
        nwObj[key] = val
      }
      if (typeof val === 'object') {
        start(val,nwObj[key], [...path, key])
      }
    }
  }
  start(obj,nwObj)
  console.log(nwObj,record,buffers)
  let b = new Blob([JSON.stringify([nwObj, record])])
  // '1100,[obj,record]buffers' 其中1100[obj,record]所占的长度
  return new Blob([`${b.size},`, b, ...buffers])
}
/**
 *
 * @param {Blob} blob
 * @returns {Object Blob} {obj,record} blob
 */
async function parseBlob(blob) {
  let objbytelen
  for (let i = 1024; i < blob.size; i += 1024) {
    let buff = await reader.readAsArrayBuffer(blob.slice(0, i))
    let index = buff.indexOf(44)
    if (index === -1) {
      continue
    }

    objbytelen = decode(buff.subarray(0, index))
    blob = blob.slice(index + 1) //除去'1000，' 剩余的blob
    break
  }

  if (!objbytelen) {
    throw new Error('not find ,')
  }

  let objBlob = blob.slice(0, objbytelen)

  return {
    objBlob,
    leftBlob: blob.slice(objbytelen)
  }
}

/**
 * @param {blob} 1100,[obj,record]buffers' 其中1100[obj,record]所占的长度
 * @return {obj}
 */
export async function blobToData(blob) {
  let { objBlob, leftBlob } = await parseBlob(blob)

  let arrStr = await reader.readAsText(objBlob)
  const [obj, record] = Object.parse(arrStr)
  if (!leftBlob.size) {
    return obj
  }

  for (let [keypath, val] of record) {
    let [type, size] = val.split(',')
    let buf = leftBlob.slice(0, size)
    if (type == 1) {
      buf = await reader.readAsArrayBuffer(buf)
    }
    keypath = keypath.split('.')
    let obj2 = obj
    for (let i = 0; i < keypath.length; i++) {
      let key = keypath[i]
      if (i === keypath.length - 1) {
        obj2[key] = buf
      } else {
        obj2 = obj2[key]
      }
    }
    leftBlob = leftBlob.slice(size)
  }
  return obj._
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
  emit(key, ...data) {
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
