const cutData = {}
import { decode, parseFragment } from './tool'

const unpack = async function(data) {

  if (new Uint8Array(data, 0, 1)[0] === 37) {
    return unpack.onfeedback(JSON.parse(decode(data.slice(1))))
  }
  const { content, header } = parseFragment(data)
  let { messageId, index, fin } = header

  if(cutData[messageId] === Symbol.for('over')) return

  if (!cutData[messageId]) {
    cutData[messageId] = { buffers: [] }
  }

  if (!index) {
    // 切割的第一条数据
    index = 0
    notice({ type: 0, messageId })
    Object.assign(cutData[messageId], header)
  }
  cutData[messageId].buffers[index] = content
  console.log('get', index, content.byteLength)
  if (fin || cutData[messageId].fin) {
    // 补发或者最后一条数据
    if (fin) {
      notice({ type: 1, messageId })
      cutData[messageId].fin = 1
    }
    const lack = verifyLack(messageId, index)
    if (lack.length) {
      cutData[messageId].lack = lack
      notice({ type: 2, messageId, lack }, 5000)
    } else {
      const realData = await _unpack(messageId)
      console.log('real', realData)
      unpack.onmessage(realData)
      notice({ type: 9, messageId })
      over(messageId)
    }
  }
}

function notice(data, time) {
  
  if(!time) {
    return unpack.onnotice(data)
  }


  if(cutData[data.messageId].lackTimeout) {
    clearTimeout(cutData[data.messageId].lackTimeout)
  }

  cutData[data.messageId].lackTimeout = setTimeout(() => unpack.onnotice(data), time)

}

function over(messageId) {
  cutData[messageId] = Symbol.for('over')
  clearTimeout(cutData[messageId].lackTimeout)
  setTimeout(_ => {
    Reflect.deleteProperty(cutData, messageId)
  }, 5 * 60000)
}

function verifyLack(messageId, index) {
  let lack = cutData[messageId].lack
  if (lack && lack.length) {
    lack = cutData[messageId].lack.filter(it => it !== index)
    return lack
  }
  lack = []
  const buffers = cutData[messageId].buffers
  const len = buffers.length

  for (let i = 0; i < len; i++) {
    if (!buffers[i]) {
      lack.push(i)
    }
  }
  return lack
}

/**
 * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
 * @returns {[promise]}
 */
function _unpack(messageId) {
  let { buffers, ...header } = cutData[messageId]
  let start = 0,
    end = 0

  buffers = new Blob(buffers)

  return Promise.all(
    header.argsTypes.map((type, i) => {
      start = end
      end += header.argsLens[i]
      return _argsUnpack(type, buffers.slice(start, end))
    })
  )
}

async function _argsUnpack(type, data) {
  data = await data.arrayBuffer()
  if (type === 1) {
    // string
    return decode(data)
  }
  if (type === 2) {
    // object
    return JSON.parse(decode(data))
  }
  if (type === 3) {
    // arraybuffer
    return data
  }
  if (type === 4) {
    // boolean
    return !!data[0]
  }

  if (type === 5) {
    // number

    return +decode(data)
  }

  if (type === 6) {
    return new Blob([data])
  }

  throw new Error('type is not one of 1,2,3,4,5,6')
}

export default unpack
