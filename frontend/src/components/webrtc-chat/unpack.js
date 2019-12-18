const cutData = {}
import { decode, encode, parseFragment } from './tool'
window.cutData = {}
const unpack = {
  async merge(data) {
    const { content, header } = parseFragment(data)
    let { messageId, index, fin } = header
    if (!cutData[messageId]) {
      cutData[messageId] = { buffers: [] }
    }
    if (!index) {
      index = 0
    }
    cutData[messageId].buffers[index] = content
    if (!index) {
      // 切割后的第一条数据
      Reflect.deleteProperty(header, 'index')
      Object.assign(cutData[messageId], header)
    }

    if (fin) {
      // 切割后的最后一条数据
      const lack = verifyLack(messageId)
      if (lack.length) {
        getLack(messageId, lack)
      } else {
        const realData = await _unpack(messageId)
        this.onmessage(realData)
      }
      return
    }
  }
}

function verifyLack(messageId) {
  const buffers = cutData[messageId].buffers
  const len = buffers.length
  const lack = []
  for (let i = 0; i < len; i++) {
    if (!buffers[i]) {
      lack.push(i)
    }
  }
  return lack
}
/**重新获取 */
function getLack(messageId, lack) {
  unpack.onmessage('reget', { messageId, lack })
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
