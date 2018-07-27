const cutData = {}

onmessage = async function({ data: { fn, data } }) {
  data = await [fn](data)
  self.postMessage(data)
}

/**
 *
 * @param {[string, [Blob, Object, arraybuffer]]}
 * @returns {Promise}
 * 加套接字，第一层：0///,表示之前的buffer需要转换字符串
 * 切片，第二层：buffer,allByteLength
 * resove([buffer, buffer])
 */
async function pack(data) {
  data = data.map(it => {
    if (typeof it === 'string') {
      return reader(new Blob([it, '0///']))
    }

    if (it instanceof Blob) {
      return reader(new Blob([it, '3///']))
    }

    if (it instanceof ArrayBuffer) {
      return new Uint8Array([...new Uint8Array(it), 50, 47, 47, 47])
    }

    return reader(new Blob([JSON.stringify(it), '1///']))
  })
  return Promise.all(data)
}

async function cut(data) {
  // 切片
  const allBuffer = Uint8Array.from(
    data.reduce((old, nw) => [...new Uint8Array(old), ...new Uint8Array(nw)])
  )

  let chunk = 1024 * 60 // 最大为65536 byte 合64k,这儿选择60k
  const byteLength = allBuffer.byteLength
  let buffers = []
  const cutIndex = (Math.reandom() * 10000) | 0 // 一条消息一个Index
  for (let start = 0; start < byteLength; start += chunk) {
    const end = Math.min(start + chunk, byteLength)
    let perfile = allBuffer.subarray(start, end)
    if (end !== byteLength) {
      perfile = await reader(new Blob([cutIndex, ',', perfile]))
    } else {
      perfile = await reader(new Blob([cutIndex, '.,', perfile]))
    }
    buffers.push(new Uint8Array(perfile))
  }

  return buffers
}

// 解切片
async function merge(data) {
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

  


}

/**
 * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
 * @returns {[promise]}
 */

async function unpack(data) {
  // 解套接字
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

    result.push(perUnpack(data[index - 3], buffer))
  })

  return Promise.all(result)
}

function perUnpack(type, data) {
  if (type === 48) {
    return reader(new Blob([data]), 'readAsText')
  }
  if (type === 49) {
    window.ee = reader(new Blob([data]), 'readAsText')
    return reader(new Blob([data]), 'readAsText').then(res => JSON.parse(res))
  }
  if (type === 50) {
    return data
  }
  if (type === 51) {
    return new Blob([data])
  }
}

function reader(data, resultType = 'readAsArrayBuffer') {
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
