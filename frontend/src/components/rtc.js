import { EventEmitter } from '@/tools'

export default class extends EventEmitter {
  emitQueue = []
  cutData = {}
  cutIndex = 0
  constructor({ config }) {
    // 传递事件
    super()
    config = config || null

    if (!RTCPeerConnection) {
      return alert('浏览器不支持webrtc, 请使用chrome或者微信')
    }

    this.pc = new RTCPeerConnection(config)

    this.pc.onicecandidate = event => {
      this.emitLocal('candidate', event.candidate)
    }

    this.dc = this.pc.createDataChannel('channel', {
      negotiated: true,
      id: 123
    })
    this.dc.binaryType = 'arraybuffer'
    this.dealWithDc()
  }

  /**
   * 发出offer
   */
  createOffer(
    config = { offerToReceiveAudio: true, offerToReceiveVideo: true }
  ) {
    return this.pc.createOffer(config).then(offer => {
      this.pc.setLocalDescription(new RTCSessionDescription(offer))
      return offer
    })
  }
  /**
   * 发送answer
   */
  createAnswer() {
    return this.pc.createAnswer().then(answer => {
      this.pc.setLocalDescription(new RTCSessionDescription(answer))
      return answer
    })
  }
  setAnswer(answer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async setOffer(offer) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
    return this.createAnswer()
  }

  setCandidate(candidate) {
    if (candidate) {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  dealWithDc() {
    const dc = this.dc

    dc.onopen = async event => {
      await new Promise(resolve => {
        const interval = setInterval(_ => {
          if (dc.readyState === 'open') {
            resolve()
            clearInterval(interval)
          }
        }, 100)
      })
      this.send()
    }

    dc.addEventListener(
      'message',
      e => {
        this.incomingMessage(e.data)
      },
      false
    )
  }

  async incomingMessage(data) {
    data = this.unpack(data)
    data = await data
    if (!data) return
    this.emitLocal(...data)
    this.emitLocal('message', data)
  }

  async emit(...data) {
    if (!data.length) return

    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }
    // 打包套接字
    const sendData = this.pack(data)
    // 消息队列
    this.emitQueue.push(sendData)

    // 没有数据，说明send循环已经结束，需重新启动。
    if (
      this.emitQueue.length === 1 &&
      this.dc &&
      this.dc.readyState === 'open'
    ) {
      this.send()
    }
  }

  /**
   * 消息队列函数，保证先emit，先发送数据
   */
  async send() {
    for (let i = 0; i < this.emitQueue.length; ) {
      const data = await this.emitQueue.shift()
      data.forEach(it => {
        this.dc.send(it)
      })
    }
  }

  /**
   *
   * @param {[string, [Blob, Object, arraybuffer]]}
   * @returns {Promise}
   * 加套接字，第一层：0///,表示之前的buffer需要转换字符串
   * 加套接字，第二层：buffer,allByteLength
   * resove([buffer, buffer])
   */
  async pack(data) {
    data = data.map((it, index) => {
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
    const res = await Promise.all(data)

    // 切片
    const allBuffer = Uint8Array.from(
      res.reduce((old, nw) => [...new Uint8Array(old), ...new Uint8Array(nw)])
    )

    let chunk = 1024 * 60 // 最大为65536 byte 合64k,这儿选择60k
    const byteLength = allBuffer.byteLength
    let buffers = []
    const cutIndex = this.cutIndex++
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
  }

  /**
   * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
   * @returns {[promise]}
   */

  async unpack(data) {
    data = new Uint8Array(data)

    // 解切片
    const idx = data.findIndex(it => it === 44),
      cutIndex = [...data.subarray(0, idx)]
        .map(it => String.fromCharCode(it))
        .join('')
        .replace('.', '')

    const fragment = new Uint8Array(data.subarray(idx + 1))

    if (!this.cutData[cutIndex]) {
      this.cutData[cutIndex] = fragment
    } else {
      this.cutData[cutIndex] = new Uint8Array([
        ...this.cutData[cutIndex],
        ...fragment
      ])
    }

    if (data[idx - 1] !== 46) {
      return false
    }

    data = this.cutData[cutIndex]
    delete this.cutData[cutIndex]

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

      result.push(this.perUnpack(data[index - 3], buffer))
    })

    return Promise.all(result)
  }

  perUnpack(type, data) {
    if (type === 48) {
      return this.reader(new Blob([data]), 'readAsText')
    }
    if (type === 49) {
      window.ee = this.reader(new Blob([data]), 'readAsText')
      return this.reader(new Blob([data]), 'readAsText').then(res =>
        JSON.parse(res)
      )
    }
    if (type === 50) {
      return data
    }
    if (type === 51) {
      return new Blob([data])
    }
  }

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
