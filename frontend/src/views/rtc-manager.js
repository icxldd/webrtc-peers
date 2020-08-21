import RTC from './rtc.js'
import socket from '@/socket'
import { EventEmitter, randomStr, findDiff } from '@/tools'

window.socket = socket

const iceConfig = {
	iceServers: [
		{ urls: ['stun:stun.freeswitch.org', 'stun:stun.ekiga.net'] },
		{
			urls: 'turn:gusheng123.top:3478',
			credential: 'g468291375',
			username: '605661239@qq.com',
		},
	],
}

export default class RTCManager extends EventEmitter {
	peers = []
	streams = []
	localStreams = []
	remoteStreams = []
	localMedia = {
		video: {},
		audio: {},
		desktopShare: {},
	}
	constructor() {
		super()
		socket.on('offer', data => this.onOffer(data))
		socket.on('answer', data => this.setAnswer(data))
		socket.on('candidate', data => this.setRemoteCandidate(data))
		this.dcFile = new MessageManager('file')
		this.dcData = new MessageManager('data')
		this.on('peer:del', peer => {
			peer.dcs && peer.dcs.forEach(dc => this.dcFile.removeDc(dc), this.dcData.removeDc(dc))
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
			this.onStateChange({ peer, roomid })
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
						offer,
					})
				})
			})
		})
	}
	createPeer({ toSocketId, id, roomid }) {
		const peer = new RTC({ config: iceConfig })
		peer.id = id
		peer.toSocketId = toSocketId

		const chat = peer.createChat()
		peer.dcs = [
			chat.createDataChannel('data'),
			chat.createDataChannel('file'),
			chat.createDataChannel('notice'),
		]
		this.dcData.add(peer.dcs[0])
		this.dcFile.add(peer.dcs[1])
		this.addEventListenner(peer, toSocketId, roomid)

		return peer
	}
	onOffer(data) {
		let peer = this.to(data.id)
		if (!peer) {
			peer = this.createPeer({ id: data.id, toSocketId: data.from })
			window.peer = peer
			this.peers.push(peer)
			this.emitLocal('peers:add', peer, this.peers)
			this.emitLocal('peers:change', this.peers)
		}

		peer.setOffer(data.offer).then(answer =>
			socket.emit('answer', {
				answer,
				from: socket.id,
				to: data.from,
				id: data.id,
			})
		)
	}

	_call(toid, roomid) {
		const peer = this.createPeer({
			id: randomStr(),
			toSocketId: toid,
			roomid,
		})
		if(!peer) {
			debugger
			alert('per为空')
		}
		this.peers.push(peer)
		window.peer = peer
		this.emitLocal('peers:add', peer, this.peers)
		this.emitLocal('peers:change', this.peers)
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

	to(id) {
		return this.peers.find(it => it.id === id)
	}

	sendCandidate(peer, toSockedId, candidate) {
		socket.emit('candidate', {
			candidate,
			to: toSockedId,
			from: socket.id,
			id: peer.id,
		})
	}

	remoteTrackHandler(e) {
		console.log('remotetrack',e )
		e.streams.forEach(s => {
			s.addEventListener('removetrack', v => {
				this.setStreams(this.streams.filter(it => v.target !== it))
			})
		})

		this.setStreams(this.streams.concat(e.streams))
	}
	onStateChange({ peer, roomid }) {
		const state = peer.pc.iceConnectionState
		if (state === 'connected') {
			if (roomid) {
				return socket.emit('jion', roomid)
			}
			const streams = Object.values(this.localMedia)
				.map(val => val.stream)
				.filter(Boolean)
			this.addStreams(streams, peer)
		} else if (state === 'closed') {
			this.emitLocal('peer:del', peer)
		} else if (state === 'disconnect') {
			setTimeout(() => {
				if (peer.pc.iceConnectionState === 'disconnect') {
					this.emitLocal('peer:del', peer)
				}
			}, 10 * 1000)
		}
	}
	setStreams(streams) {
		this.streams = [...streams]
		this.emitLocal('streams', this.streams)
	}
	/**
	 *
	 * @param {video, audio, desktopShare} config
	 * @returns {stream}
	 */
	async getLocalMedia(type, config) {
		if (!config) return null
		let newStream = null
		if (config === true) {
			config = { [type]: true }
		}
		try {
			if (type === 'desktopShare') {
				newStream = await navigator.mediaDevices.getDisplayMedia(config)
			} else {
				newStream = await navigator.mediaDevices.getUserMedia(config)
			}
		} catch (e) {
			console.error(e)
			alert(`获取${type}错误`)
		}

		return newStream
	}
	removeTracks(tracks, peer) {
		const set = new Map()
		peer.pc.getSenders().forEach(sender => {
			set.set(sender.track, sender)
		})
		tracks.forEach(track => {
			if (!set.has(track)) return

			peer.pc.removeTrack(set.get(track))
		})
	}
	addStreams(streams, peer) {
		const set = new Set()
		peer.pc.getLocalStreams().forEach(stream => set.add(stream))
		streams.forEach(stream => {

			if (set.has(stream)) return
			stream.getTracks().forEach(track => {
				console.log('add', track, stream,peer)
				peer.pc.addTrack(track, stream)
			})
			stream.oninactive = e => this.oninactive(e)
		})
	}
	async setSelfMediaStatus(nwConfig) {
		if (!nwConfig) return

		let removeStreams = new Set()
		let addStream = new Map()

		for (let type of ['video', 'audio', 'desktopShare']) {
			const { stream, config } = this.localMedia[type]
			if (JSON.stringify(nwConfig[type]) === JSON.stringify(config)) {
				continue
			}
			if (stream) {
				removeStreams.add(stream.id)

				const tracks = stream.getTracks()
				tracks.forEach(it => it.stop())
				this.localMedia[type].stream = null
				this.localMedia[type].config = nwConfig[type]
			}
			if (nwConfig[type]) {
				const nwStream = await this.getLocalMedia(type, nwConfig[type])

				addStream.set(type, nwStream)
			}
		}

		const pureAddStream = []
		if (addStream.size) {
			for (let [key, stream] of addStream) {
				this.localMedia[key] = { config: nwConfig[key], stream }
				stream.isSelf = true
				pureAddStream.push(stream)
			}
		}

		this.peers.forEach(peer => {
			this.addStreams(pureAddStream, peer)
		})

		this.setStreams(this.streams.filter(it => !removeStreams.has(it.id)).concat(pureAddStream))
	}
	// 手动关闭摄像头或者共享等
	oninactive(e) {
		const stream = e.target
		for (let peer of this.peers) {
			this.removeTracks(stream.getTracks(), peer)
		}
		const type = Object.keys(this.localMedia).find(type => this.localMedia[type].stream === stream)

		this.localMedia[type].config = false
		this.localMedia[type].stream = null
		this.setStreams(this.streams.filter(it => it !== stream))
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
	removeDc(dc) {
		this.dcs = this.dcs.filter(it => it !== dc)
		this.emitLocal('dc:del', dc)
	}

	emit(key, data, desc) {
		const map = new Map()
		const delFn = dc => map.delete(dc)
		console.log('se23nd', data)
		this.on('dc:del', delFn)
		let p = () => {}
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

				p({
					...e,
					peersCount: map.size,
					percent: allSendSize / (e.total * map.size),
					completedCount: [...map.values()].map(it => it === e.total).length,
				})
			})
		})

		return function(progress) {
			if (typeof progress !== 'function') throw 'progress need function'
			p = progress
		}
	}
}
