import RTC from './rtc.js'
import socket from '@/socket'
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

export default class RTCManager extends EventEmitter {
	peers = []
	streams = []
	constructor() {
		super()
		socket.on('offer', data => this.onOffer(data))
		socket.on('answer', data => this.setAnswer(data))
		socket.on('candidate', data => this.setRemoteCandidate(data))
		this.dcFile = new MessageManager('file')
		this.dcData = new MessageManager('data')
		this.on('peer:del', peer => {
			peer.dcs &&
				peer.dcs.forEach(dc => this.dcFile.remove(dc), this.dcData.remove(dc))
		})
		// socket.on('broken', data => this.onSomeOneBroken(data))
	}

	async createRoom(data) {
		socket.emit('create-room', data)
		this.roomid = data.roomid
	}

	async addEventListenner(peer, toid, roomid) {
		peer.pc.onicecandidate = e => this.sendCandidate(peer, toid, e.candidate)
		peer.pc.addEventListener('iceconnectionstatechange', event => {
			console.log(peer.pc.iceConnectionState)
			if (roomid) {
				this.onStateChange({ peer, roomid })
			}
		})
		peer.pc.ontrack = track => this.remoteTrackHandler(track)

		setTimeout(() => {
			peer.pc.addEventListener('negotiationneeded', e => {
				console.log('negotiationneeded', e)
				peer.createOffer().then(offer => {
					socket.emit('offer', {
						from: socket.id,
						to: toid,
						id: peer.id,
						offer
					})
				})
			})
		})
	}
	createPeer({ toSocketId, id, roomid }) {
		const peer = new RTC({ config: iceConfig })
		peer.id = id
		window.peer = peer

		peer.toSocketId = toSocketId

		const chat = peer.createChat()
		peer.dcs = [chat.createDataChannel('data'), chat.createDataChannel('file')]
		this.dcData.add(peer.dcs[0])
		this.dcFile.add(peer.dcs[1])

		this.addEventListenner(peer, toSocketId, roomid)
		this.peers.push(peer)
		this.emitLocal('peers:add', peer, this.peers)
		this.emitLocal('peers:change', this.peers)
		return peer
	}

	onOffer(data) {
		let peer = this.to(data.id)
		if (!peer) {
			peer = this.createPeer({ id: data.id, toSocketId: data.from })
		}

		peer.setOffer(data.offer).then(answer =>
			socket.emit('answer', {
				answer,
				from: socket.id,
				to: data.from,
				id: data.id
			})
		)
	}

	_call(toid, roomid) {
		const peer = this.createPeer({
			id: randomStr(),
			toSocketId: toid,
			roomid
		})
		peer.createOffer().then(offer => {
			socket.emit('offer', { from: socket.id, to: toid, id: peer.id, offer })
		})
	}

	async call(picked) {
		this.roomid = picked.roomid

		picked.socketIds.forEach(it => {
			this._call(it.id, picked.roomid)
		})
	}

	setAnswer(data) {
		const peer = this.to(data.id)
		peer.setAnswer(data.answer)
	}

	setRemoteCandidate(data) {
		const peer = this.to(data.id)
		if (peer) {
			peer.setCandidate(data.candidate)
		}
	}

	getUserMedia(config = { video: { with: 320, height: 480 }, audio: true }) {
		if (location.protocol === 'https:' || location.hostname === 'localhost') {
			return navigator.mediaDevices.getUserMedia(config).catch(console.log)
		}
		return false
	}

	to(id) {
		return this.peers.find(it => it.id === id)
	}

	sendLocalStream(peer, localStream) {
		if (!localStream) return
		localStream.getTracks().forEach(track => peer.pc.addTrack(track))
	}

	sendCandidate(peer, toSockedId, candidate) {
		socket.emit('candidate', {
			candidate,
			to: toSockedId,
			from: socket.id,
			id: peer.id
		})
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

	remoteTrackHandler(e) {
		this.addStream(e.streams[0])
	}

	onStateChange({ peer, roomid }) {
		const state = peer.pc.iceConnectionState
		if (state === 'connected') {
			if (roomid) {
				return socket.emit('jion', roomid)
			}
		} else if (state === 'closed') {
			this.emitLocal('peer:del', peer)
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

class MessageManager extends EventEmitter {
	dcs = []
	constructor() {
		super()
		this.emitLocal = this.emitLocal.bind(this)
	}
	add(dc) {
		dc.onmessage = e => this.emitLocal(e.eventKey, e.data, e.desc)
		dc.onprogress = e => {
			e.percent = e.getBytes / e.total
			this.emitLocal(e.eventKey + ':progress', e)
		}
		this.dcs.push(dc)
	}
	remove(dc) {
		this.dcs = this.dcs.filter(it => it !== dc)
		this.emitLocal('dc:del', dc)
	}

	emit(key, data, desc) {
		const map = new Map()
		const delFn = dc => {
			map.delete(dc)
		}
		this.on('dc:del', delFn)
		let p
		this.dcs.forEach(dc => {
			map.set(dc, 0)
			dc.emit(
				key,
				data,
				desc
			)(e => {
				map.set(dc, e.sendSize)
				const allSendSize = [...map.values()].reduce((p, n) => p + n, 0)
				const percent = allSendSize / (e.total * map.size)

				if (percent === 1) {
					this.off('dc:del', delFn)
				}
				p &&
					p({
						...e,
						peersCount: map.size,
						percent: allSendSize / (e.total * map.size),
						completedCount: [...map.values()].map(it => it === e.total).length
					})
			})
		})

		return function(progress) {
			if (typeof progress !== 'function') throw 'progress need function'
			p = progress
		}
	}
}
