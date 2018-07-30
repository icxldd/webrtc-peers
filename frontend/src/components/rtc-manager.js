import WebRtc from './rtc.js'
import socket from '@/socket'
import uuid from 'uuid/v4'
import { EventEmitter } from '@/tools'

window.socket = socket
const iceConfig = {
  iceServers: [
    { urls: ['stun:stun.freeswitch.org', 'stun:stun.ekiga.net'] },
    {
      urls: 'turn:gusheng123.top:3478',
      credential: 'g468291375',
      username: '605661239@qq.com'
    }
  ]
}

export default class extends EventEmitter {
  peers = []
  streams = []
  emitqueue = []
  constructor() {
    super()
    socket.on('offer', data => this.onOffer(data))
    socket.on('answer', data => this.setAnswer(data))
    socket.on('candidate', data => this.setRemoteCandidate(data))
    socket.on('broken', data => this.onSomeOneBroken(data))
  }

  async createRoom(data) {
    this.clear()
    socket.emit('create-room', data)

    this.addStream()

    this.roomid = data.roomid
  }

  createRTC({ toSocketId, rtcid, roomid }) {
    const peer = new WebRtc({ config: iceConfig })
    peer.id = rtcid
    this.peers.push(peer)

    window.peers = this.peers

    this.sendCandidate(peer, toSocketId)
    this.addRemoteStream(peer)
    this.sendLocalStream(peer)
    this.dealLeave(peer)
    peer.toSocketId = toSocketId
    peer.on('message', msg => this.onmessage(msg))
    
    peer.pc.addEventListener('iceconnectionstatechange', event => {
      console.log(peer.pc.iceConnectionState)
      this.onStateChange({ peer, roomid })
    })
    
    return peer
  }

  onOffer(data) {
    const peer = this.createRTC({ rtcid: data.rtcid, toSocketId: data.from })
    peer.setOffer(data.offer).then(answer =>
      socket.emit('answer', {
        answer,
        from: socket.id,
        to: data.from,
        rtcid: data.rtcid
      })
    )
  }

  _call(toid, roomid) {
    const peer = this.createRTC({ rtcid: uuid(), toSocketId: toid, roomid })
    peer.createOffer().then(offer => {
      socket.emit('offer', { offer, from: socket.id, to: toid, rtcid: peer.id })
    })

  }

  async call(picked) {
    this.clear()
    this.roomid = picked.roomid

    await this.addStream()

    picked.socketIds.forEach(it => {
      this._call(it.id, picked.roomid)
    })
  }

  setAnswer(data) {
    const peer = this.to(data.rtcid)

    if (peer) {
      peer.setAnswer(data.answer)
    }
  }

  setRemoteCandidate(data) {
    const peer = this.to(data.rtcid)
    if (peer) {
      peer.setCandidate(data.candidate)
    }
  }

  getUserMedia(config = { video: { with: 320, height: 480 }, audio: true }) {
    return navigator.mediaDevices.getUserMedia(config).catch(console.log)
  }

  to(id) {
    return this.peers.find(it => it.id === id)
  }

  sendLocalStream(peer) {
    if (!this.localStream) return
    this.localStream
      .getTracks()
      .forEach(track => peer.pc.addTrack(track, this.localStream))
  }

  sendCandidate(peer, id) {
    peer.on('candidate', candidate =>
      socket.emit('candidate', {
        candidate,
        to: id,
        from: socket.id,
        rtcid: peer.id
      })
    )
  }

  async addStream(stream) {
    if (!stream) {
      if (!this.localStream) {
        this.localStream = await this.getUserMedia()
      }
      if (!this.localStream) return
      stream = this.localStream.clone()
      const audiotrack = stream.getAudioTracks()
      // 自己端的streams
      audiotrack.forEach(it => stream.removeTrack(it))
      stream.isSelf = true
    }

    if (this.streams.some(it => it.id === stream.id)) return
    this.streams.push(stream)
    this.setStreams(this.streams)
  }

  addRemoteStream(peer) {
    peer.pc.ontrack = obj => {
      obj.streams[0].rtcid = peer.id
      this.addStream(obj.streams[0])
    }
  }

  /**
   * 手动离开
   * @param  peer
   */
  dealLeave(peer) {
    peer.on('leave', () => {
      this.afterLeave(peer)
    })
  }

  /**
   * 对方掉线了
   * @param {socketid}
   */
  onSomeOneBroken({ socketid }) {
    const peer = this.peers.find(it => it.toSocketId === socketid)
    if (peer) {
      this.afterLeave(peer)
    }
  }

  /**
   * 离开后删除rtc与 stream
   */
  afterLeave(peer) {
    const streams = this.streams.filter(it => it.rtcid !== peer.id)
    this.peers = this.peers.filter(it => it.id !== peer.id)
    window.peers = this.peers

    this.emitLocal('peers', peer, this.peers)

    this.setStreams(streams)
    peer.pc.close()
  }

  onStateChange({ peer, roomid }) {
    const state = peer.pc.iceConnectionState
    if (state === 'connected') {
      this.emitLocal('peers', peer, this.peers)
      if (roomid) {
        return socket.emit('jion', roomid)
      }
    }

    if (state !== 'failed') return
    // 给出3秒种断线重连 ：未补充
    setTimeout(_ => {
      if (state !== 'failed') return
      this.afterLeave(peer)
    }, 3000)
  }

  clear() {
    this.peers.forEach(it => {
      it.emit('leave')
      it.pc.close()
    })

    if (this.roomid) {
      socket.emit('leave', this.roomid)
    }

    window.peers = []
    this.peers = []

    this.setStreams([])
  }

  emit(key, ...data) {
    this.peers.forEach(it => {
      it.emit(key, ...data)
    })
  }

  onmessage(data) {
    this.emitLocal(...data)
  }

  setStreams(streams) {
    this.streams = [...streams]
    this.emitLocal('streams', this.streams)
  }

  close() {
    socket.off('candidatae')
    socket.off('answer')
    socket.off('offer')
  }
}
