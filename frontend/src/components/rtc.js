import { EventEmitter } from '@/tools'
import WebRtcChat from '@/workers/webrtc-chat'

export default class extends EventEmitter {
  emitQueue = []
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

    this.chat = new WebRtcChat(this.dc)
    this.chat.onmessage = data => this.incomingMessage(data)

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
    this.dc.onopen = async event => {
      await new Promise(resolve => {
        const interval = setInterval(_ => {
          if (this.dc.readyState === 'open') {
            resolve()
            clearInterval(interval)
          }
        }, 100)
      })
      this.send()
    }

  }

  async incomingMessage(data) {
    console.log('mseeage', data)
    this.emitLocal(...data)
    this.emitLocal('message', data)
  }

  async emit(...data) {
    if (!data.length) return

    if (typeof data[0] !== 'string') {
      throw new Error('emit key must be String')
    }
    if (this.dc.readyState === 'open') {
   
      this.chat.send(...data)
    } else {
      this.emitQueue.push(data)
    }

  }

  /**
   * 消息队列函数，保证先emit，先发送数据
   */
  async send() {
    this.emitQueue.forEach(it => {
      this.chat.send(...it)
    })
  }
}
