import { EventEmitter } from '@/tools'
import WebRtcChat from './webrtc-chat'


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
    this.chat = new WebRtcChat(this.dc)
    this.chat.onmessage = data => this.incomingMessage(data)
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

  async incomingMessage(data) {
    this.emitLocal(...data)
    this.emitLocal('message', data)
  }

  async emit(...data) {
    
    if (!data.length) return
    this.chat.send(...data)
  }
}
