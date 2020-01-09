import { decode, parseFragment, reader ,getHeader} from '../tool'

export default class Unpacker {
  _controller = null
  res = null
  unpack(buffer) {
    if (!this.res) {
      const {header,leftBuffer}= getHeader(buffer)
      buffer = leftBuffer
      const readStream = new ReadableStream({
        start: controller => {
          this._controller = controller
        }
      })
      
      this.res = new Response(readStream, {headers: header})

      this.onunpackover(this.res)
    }
    
    this.onunpackprogress(buffer.byteLength)
    


  }
}

let data = 0
const unpack = async function(data) {
  const { leftBuffer, header } = parseFragment(data)
  unpack.onprogress(cutData[messageId])
}

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
