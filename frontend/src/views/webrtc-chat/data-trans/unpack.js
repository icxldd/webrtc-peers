
import { decode, parseFragment, reader } from '../tool'


const unpack = async function(data) {
  const { content, header } = parseFragment(data)
  if (!cutData[messageId].buffers[index]) {
    cutData[messageId].buffers[index] = content
    cutData[messageId].getByte += content.byteLength
    unpack.onprogress(cutData[messageId])
  }
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
  data = await reader.readAsArrayBuffer(data)
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
