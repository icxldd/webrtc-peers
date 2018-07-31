const cutData = {}


self.onmessage = async function (e) {
  merge(e.data)
}





// 合切片
function merge(data) {

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
  const realData = cutData[cutIndex]
  delete cutData[cutIndex]
  return unpack(realData)
}

/**
 * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
 * @returns {[promise]}
 */
async function unpack(data) {
  let result = []
  let start = 0
  data.forEach((it, index) => {
    if (
      index < 4 ||
      !(
        [1, 2, 3, 4, 5, 6].includes(data[index - 3]) &&
        data[index - 1] === 10 &&
        data[index - 2] === 10 &&
        it === 10
      )
    ) {
      return false
    }

    const buffer = data.subarray(start, index - 3)
    start = index + 1

    result.push(perUnpack(data[index - 3], buffer))
  })
  const unpackData = await Promise.all(result)
  self.postMessage(unpackData)

}

function perUnpack(type, data) {
  if (type === 1) { // string
    return reader(new Blob([data]), 'readAsText')
  }
  if (type === 2) { // blob
    return new Blob([data])
  }
  if (type === 3) { // arraybuffer
    return data
  }
  if (type === 4) {// boolean
    return new Boolean(data[0])
  }

  if (type === 5) {// number
    return reader(new Blob([data]), 'readAsText').then(res => +res)
  }

  if (type === 6) { // object
    return reader(new Blob([data]), 'readAsText').then(res => JSON.parse(res))
  }

  throw new Error('type is not one of 1,2,3,4,5,6')
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