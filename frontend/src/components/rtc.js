import { EventEmitter } from '@/tools'
import { pack, cut, unpackWorker } from '@/workers/datachannel'

export default class extends EventEmitter {
  emitQueue = []
  cutData = {}
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
    if (!this.sendStart && this.dc && this.dc.readyState === 'open') {
      this.send()
    }
  }

  /**
   * 消息队列函数，保证先emit，先发送数据
   */
  async send() {
    if (!this.emitQueue.length) return
    this.sendStart = true
    for (let i = 0; i < this.emitQueue.length; ) {
      const data = await this.emitQueue.shift()
      console.log('send', data)
      data.forEach(it => {
        this.dc.send(it)
      })
      if (!this.emitQueue.length) {
        this.sendStart = false
      }
    }
  }

  /**
   *
   * @param {[string, [Blob, Object, arraybuffer]]}
   * @returns {Promise}
   * @resove([buffer, buffer])
   */
  async pack(data) {
    data = await pack(data)
    return cut(data)
  }

  /**
   * 按照套接字解包,只对emit('aaa', 'xx', {}, arraybuffer)解包,不对对象的某个属性是blob这种格式解包.
   * @returns {[promise]}
   */

  async unpack(data) {
    data = new Uint8Array(data)
    const idx = data.findIndex(it => it === 44)

    unpackWorker.merge(data)
    if (data[idx - 1] !== 46) {
      return false
    }
    const mergeResult = await new Promise(resolve => {
      unpackWorker.worker.onmessage = function() {
        resolve(data)
      }
    })
    console.log('mergeresult', mergeResult)
    const unpackResult = await unpackWorker.unpack(mergeResult)
    console.log(unpackResult)
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
