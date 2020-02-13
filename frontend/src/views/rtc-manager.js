import RTC from './rtc.js'
import socket from '@/socket'
import uuid from 'uuid/v4'
import { EventEmitter, randomStr } from '@/tools'

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
  constructor() {
    super()
    socket.on('offer', data => this.onOffer(data))
    socket.on('answer', data => this.setAnswer(data))
    socket.on('candidate', data => this.setRemoteCandidate(data))
    // socket.on('broken', data => this.onSomeOneBroken(data))
  }

  async createRoom(data) {
    socket.emit('create-room', data)

    this.addStream()

    this.roomid = data.roomid
  }

  createRTC({ toSocketId, rtcid, roomid }) {
    const peer = new RTC({ config: iceConfig })
    peer.id = rtcid
    peer.chat.onmessage = e => this.emitLocal(e.eventKey, e.data, e.desc)
    peer.chat.onprogress = e =>{
      e.percent = (e.getBytes / e.total).toFixed(4)
      this.emitLocal(e.eventKey + ':progress', e)
    }

    window.peer = peer
    this.sendCandidate(peer, toSocketId)
    this.addRemoteStream(peer)
    this.sendLocalStream(peer)
    peer.toSocketId = toSocketId

    peer.pc.addEventListener('iceconnectionstatechange', event => {
      console.log('statechange')
      console.log(peer.pc.iceConnectionState)
      this.onStateChange({ peer, roomid })
    })

    return peer
  }

  onOffer(data) {
    const peer = this.createRTC({ rtcid: data.rtcid, toSocketId: data.from })
    this.peers.push(peer)
    this.emitLocal('peers:add', peer, this.peers)
    this.emitLocal('peers:change', this.peers)
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
    this.peers.push(peer)
    this.emitLocal('peers:add', peer, this.peers)
    this.emitLocal('peers:change', this.peers)
    peer.createOffer().then(offer => {
      socket.emit('offer', { offer, from: socket.id, to: toid, rtcid: peer.id })
    })
  }

  async call(picked) {
    this.roomid = picked.roomid

    await this.addStream()

    picked.socketIds.forEach(it => {
      this._call(it.id, picked.roomid)
    })
  }

  setAnswer(data) {
    const peer = this.to(data.rtcid)
    peer.setAnswer(data.answer)
  }

  setRemoteCandidate(data) {
    const peer = this.to(data.rtcid)
    if (peer) {
      peer.setCandidate(data.candidate)
    }
  }

  getUserMedia(config = { video: { with: 320, height: 480 }, audio: false }) {
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

  onStateChange({ peer, roomid }) {
    const state = peer.pc.iceConnectionState
    if (state === 'connected') {
      if (roomid) {
        return socket.emit('jion', roomid)
      }
    }
  }
  emit(key, data, desc) {
    let sendSize = 0
    const map = new Map()
    const delFn = peer => {
      map.delete(peer)
    }
    this.on('peers:del', delFn)
    let p ,
    overCount=0
    this.peers.forEach(peer => {
      map.set(peer, 0)
      peer.emit(
        key,
        data,
        desc
      )(e => {
        map.set(peer, e.sendSize)
        const allSendSize = [...map.values()].reduce((p, n) => p + n, 0)
        const percent = (allSendSize / (e.total * map.size)).toFixed(4)
        
        if (percent === 1) {
          this.off('peers:del', delFn)
        }
        p && p({
          ...e,
          peersCount: map.size,
          percent: allSendSize / (e.total * map.size),
          completedCount:[...map.values()].map(it => it===e.total).length,
        })
      })
    })

    return function(progress) {
      if (typeof progress !== 'function') throw 'progress need function'
      p = progress
    }
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
