const map = {
  base64: 'readAsDataURL',
  arrayBuffer: 'readAsArrayBuffer',
  blob: 'readAsArrayBuffer'
}
export function fileReader({ data, type = 'base64' } = {}) {
  if (!data) {
    return Promise.reject(0)
  }
  if(!(data instanceof Blob) && !(data instanceof File) ) {
    return Promise.reject('data must be blob or file')
  }
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader[map[type]](data)

    reader.onload = e => {
      if (type === 'blob') {
        const blob = new Blob([e.target.result])
        return resolve(blob)
      }

      resolve(e.target.result)
    }

    reader.onabort = params => {
      reject('中断')
    }
  })
}

export function fileLoad({ data, name }) {
  const blob = new Blob([data])
  const a = document.createElement('a')
  a.download = name
  a.href = URL.createObjectURL(blob)
  a.click()
}
