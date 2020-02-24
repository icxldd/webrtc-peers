
import { EventEmitter } from '@/tools'
import WebRTCChat from '@/plugins/webrtc-chat'

export default class RTC extends EventEmitter {
  constructor({ config }) {
    super()
    config = config || null

    if (!RTCPeerConnection) {
      return alert('浏览器不支持webrtc, 请使用chrome或者微信')
    }

    this.pc = new RTCPeerConnection(config)

  }

  /**
   * 发出offer
   */
  createOffer() {
    return this.pc.createOffer().then(offer => {
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
  createChat() {
    return new WebRTCChat(this.pc)
  }
  addTrack(track, stream) {
    
  }
}
