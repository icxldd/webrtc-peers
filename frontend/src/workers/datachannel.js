import Worker from './datachennel.worker.js'

export const pack = function(data) {
  const worker = new Worker()
  worker.postMessage({ fn: 'pack', data })
  return new Promise(resolve => {
    worker.onmessage = function({ data }) {
      resolve(data)
    }
  })
}

export const cut = async function(data) {
  const worker = new Worker()
  worker.postMessage({ fn: 'cut', data })
  return new Promise(resolve => {
    worker.onmessage = function({ data }) {
      resolve(data)
    }
  })
}


export const unpackWorker = {
  worker: new Worker(),
  async unpack(data) {
    this.worker.postMessage({ fn: 'merge', data })
  }
}
