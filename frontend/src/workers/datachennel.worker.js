const cutData = {}

onmessage = async function({ data: { data, fn } }) {

  data = await workerFn[fn](data)
  self.postMessage(data)
}

const workerFn = {
  /**
   *
   * @param {[string, [Blob, Object, arraybuffer]]}
   * @returns {Promise}
   * 加套接字，第一层：0///,表示之前的buffer需要转换字符串
   * 切片，第二层：buffer,allByteLength
   * resove([buffer, buffer])
   */

  async pack(data) {
    data = data.map(it => {
      if (typeof it === 'string') {
        return this.reader(new Blob([it, '0///']))
      }

      if (it instanceof Blob) {
        return this.reader(new Blob([it, '3///']))
      }

      if (it instanceof ArrayBuffer) {
        return new Uint8Array([...new Uint8Array(it), 50, 47, 47, 47])
      }

      return this.reader(new Blob([JSON.stringify(it), '1///']))
    })
    return Promise.all(data)
  },

  async cut(data) {
    // 切片
    const allBuffer = Uint8Array.from(
      data.reduce((old, nw) => [...new Uint8Array(old), ...new Uint8Array(nw)])
    )

    let chunk = 1024 * 60 // 最大为65536 byte 合64k,这儿选择60k
    const byteLength = allBuffer.byteLength
    let buffers = []
    const cutIndex = (Math.random() * 10000) | 0 // 一条消息一个Index
    for (let start = 0; start < byteLength; start += chunk) {
      const end = Math.min(start + chunk, byteLength)
      let perfile = allBuffer.subarray(start, end)
      if (end !== byteLength) {
        perfile = await this.reader(new Blob([cutIndex, ',', perfile]))
      } else {
        perfile = await this.reader(new Blob([cutIndex, '.,', perfile]))
      }
      buffers.push(new Uint8Array(perfile))
    }

    return buffers
  },

  // 合切片
  async merge(data) {

    data = new Uint8Array(data)

    const idx = data.findIndex(it => it === 44),
      cutIndex = [...data.subarray(0, idx)]
        .map(it => String.fromCharCode(it))
        .join('')
        .replace('.', '')

    const fragment = new Uint8Array(data.subarray(idx + 1))

    if (!cutData[cutIndex]) {
      cutData[cutIndex] = fragment
    } else {
      cutData[cutIndex] = new Uint8Array([...cutData[cutIndex], ...fragment])
    }

    if (data[idx - 1] !== 46) {
      return false
    }
    let resultData = cutData[cutIndex]
    delete cutData[cutIndex]
    return resultData
  },

  /**
   * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
   * @returns {[promise]}
   */
  aa: 0,

  async unpack(data) {
    // 解套接字
    // console.log('unpackStart', data)
    const a  = this.aa
    aa++
    console.log('start', a, data)
    let result = []
    let start = 0
    data.forEach((it, index) => {
      if (
        index < 4 ||
        !(
          [48, 49, 50, 51].includes(data[index - 3]) &&
          data[index - 1] === 47 &&
          data[index - 2] === 47 &&
          it === 47
        )
      ) {
        return false
      }

      const buffer = data.subarray(start, index - 3)
      start = index + 1

      result.push(this.perUnpack(data[index - 3], buffer))
    })
    console.log('end', a, result)
    // console.log('result-pre', result)
    return Promise.all(result)
  },

  perUnpack(type, data) {
    if (type === 48) {
      return this.reader(new Blob([data]), 'readAsText')
    }
    if (type === 49) {
      return this.reader(new Blob([data]), 'readAsText').then(res => JSON.parse(res))
    }
    if (type === 50) {
      return data
    }
    if (type === 51) {
      return new Blob([data])
    }
  },

  reader(data, resultType = 'readAsArrayBuffer') {
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader[resultType](data)
      reader.onload = e => {
        resolve(e.target.result)
      }
      reader.onerror = e => {
        reject(e)
      }
    })
  }
}
