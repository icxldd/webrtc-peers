import WebRTCChat from '@/plugins/webrtc-chat'
import { EventEmitter } from '@/tools'
export default class RTC extends EventEmitter {
  constructor({ config }) {
    super()
    config = config || null

    if (!RTCPeerConnection) {
      return alert('浏览器不支持webrtc, 请使用chrome或者微信')
    }

    this.pc = new RTCPeerConnection(config)

    this.pc.onicecandidate = event => {
      this.emitLocal('candidate', event.candidate)
    }
    this.chat = new WebRTCChat(this.pc)
    this.emit = this.chat.emit.bind(this.chat)
  }

  /**
   * 发出offer
   */
  createOffer(
    config = { offerToReceiveAudio: false, offerToReceiveVideo: true }
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
}
