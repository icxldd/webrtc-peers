import Worker from './file-reader.worker.js'

const reader = new Worker()
const read = function(data) {
  reader.postMessage(data)
  return new Promise(resolve => {
    reader.onmessage = function({ data }) {
      resolve(data)
    }
  })
}

export default read
