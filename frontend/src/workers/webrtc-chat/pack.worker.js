onmessage = async function ({ data }) {
  const packData = await pack(data)
  cut(packData)
}


async function pack(data) {
  data = data.map(it => {
    if (typeof it === 'string') {
      return reader(new Blob([it, new Uint8Array([1, 5, 5, 5])]))
    }

    if (it instanceof Blob) {
      return reader(new Blob([it, new Uint8Array([2, 5, 5, 5])]))
    }

    if (it instanceof ArrayBuffer) {
      return new Uint8Array([...new Uint8Array(it), 3, 5, 5, 5])
    }

    if (typeof it === 'boolean') {
      return new Uint8Array([it, 4, 5, 5, 5])
    }

    if (typeof it === 'number') {
      return reader(new Blob([it, new Uint8Array([5, 5, 5, 5])]))
    }

    return reader(new Blob([JSON.stringify(it), new Uint8Array([6, 5, 5, 5])]))
  })
  return Promise.all(data)
}

async function cut(data) {
  // 切片
  const allBuffer = Uint8Array.from(
    data.reduce((old, nw) => [...new Uint8Array(old), ...new Uint8Array(nw)])
  )

  const chunk = 1024 * 60 // 最大为65536 byte 合64k,这儿选择60k
    , byteLength = allBuffer.byteLength
    , messageId = (Math.random() * 10000) | 0 // 一条消息一个Index
  for (let start = 0, dataIndex = 0; start < byteLength; start += chunk, dataIndex++) {
    const end = Math.min(start + chunk, byteLength)
    let perfile = allBuffer.subarray(start, end)
    if (end !== byteLength) {
      perfile = await reader(new Blob([messageId, ',', perfile]))
    } else {
      perfile = await reader(new Blob([messageId, '.,', perfile]))
    }
    self.postMessage(perfile)
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