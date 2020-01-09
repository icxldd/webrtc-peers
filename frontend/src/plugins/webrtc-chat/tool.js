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
  blob: 2,
}

export const getType = function(val) {
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

export const getHeader = function(buffer) {
  buffer = new Uint8Array(buffer)

  let lenBufferIndex = buffer.indexOf(44) // 44为,
  const headerLen = +decode(buffer.subarray(0, lenBufferIndex))

  const headerBuffer = buffer.subarray(
    lenBufferIndex + 1,
    headerLen + lenBufferIndex + 1
  )
  let header = JSON.parse(decode(headerBuffer))

  return {
    header,
    leftbuffer: buffer.subarray(headerLen + lenBufferIndex + 1)
  }
}

export const getByte = async function(it) {
  let type = getType(it)

  let buffer
  if (type === 'String') {
    buffer = encode(it)
  } else if (type === 'Blob') {
    buffer = await reader.readAsArrayBuffer(it)
  }  else if (type === 'Boolean') {
    buffer = new Uint8Array([it])
  } else if (type === 'Number') {
    buffer = encode(it)
  } else if (type === 'Object' || type === 'Array') {
    buffer = await reader.readAsArrayBuffer(new Blob([JSON.stringify(it)]))
  } else if (it.buffer && it.buffer instanceof ArrayBuffer) {
    buffer = it
    type= 'Arraybuffer'
  }
  return {
    type: types[type], // 转换成1，2，3等
    buffer
  }
}

export const mergeBuffer = function(...datas) {
  let len = 0
  for (let it of datas) {
    len += it.byteLength
  }
  let result = new Uint8Array(len)
  let offset = 0
  for (let it of datas) {
    result.set(it, offset)
    offset += it.byteLength
  }
  return result
}


export function jsonToBlob(obj) {
  let record = [], // [['a.b.c', 2341334]]
  buffers=[] //[buffer]
  function start(obj,path =[]) {
    for(let key in obj) {
      let val = obj[key]
      let keypath = [...path,key].join('.')
      if(val instanceof Uint8Array) {
        record.push([keypath, `1, ${val.byteLength}`])
        Reflect.deleteProperty(obj,key)
        buffers.push(val)
      } else if(val instanceof Blob) {
        record.push([keypath, `2, ${val.size}`])
        buffers.push(val)   
        Reflect.deleteProperty(obj,key)
      } else if(typeof val === 'object') {
        start(val,[...path, key])
      }
    }
  }
  start(obj)
  let b = new Blob([JSON.stringify([obj,record])])
  // '1100,[obj,record]buffers' 其中1100[obj,record]所占的长度
  return new Blob([`${b.size},`, b,...buffers])
}

export function blobToJson(buff) {
  buff = new Uint8Array(buff)
  let len = buff.indexOf(44)
  let aa = decode(buff.subarray(0, len))
  buff = buff.subarray(len+1)
  let  aaa = decode(buff.subarray(0,aa))
  let [obj, record] = JSON.parse(aaa)
  buff = buff.subarray(aa)
  for (let [keypath, val] of record) {
    let [type, size] = val.split(',')
    let buf = buff.subarray(0, +size)  
    if(type == 2) {
      buf = new Blob([buf])
    }
    keypath = keypath.split('.')
    let obj2 = obj
    for(let i=0;i< keypath.length;i++) {
      let key = keypath[i]
      if(i === keypath.length-1) {
        obj2[key] = buf
      } else {
        obj2 = obj2[key]
      }
    }
    buff = buff.subarray(+size)

  }
  return obj
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