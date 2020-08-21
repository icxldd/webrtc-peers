import Datachannel from './datachannel'
import { EventEmitter } from './tool'
export default class WebRTCChat extends EventEmitter{
	id = 0
	dataChannels = {}
	constructor(pc) {
		super()
		this.pc = pc
	}
	createDataChannel(label) {
		const dcManager = new Datachannel(this.pc, label, this.id++)
		this.handelTransEvent(dcManager)
		this.dataChannels[label] = dcManager
		this.handleDataChannelCEvent(dcManager.dc)
		return dcManager
	}
	handleDataChannelCEvent(dc) {
		dc.addEventListener('error', err => console.error('datachannel:' + dc.label,err))
		dc.addEventListener('close', () => this._del(dc))
	}
	_del(dc) {
		Reflect.deleteProperty(this.dataChannels, dc.label)
	}
	handelTransEvent(dcManager) {
		dcManager.trans
			.on('unpackprogress', (eventKey, buffer, progressHeader) => {
				this.onprogress &&
					this.onprogress({ eventKey, buffer, ...progressHeader })
			})
			.on('unpackover', (eventKey, data, desc) => {
				this.onmessage && this.onmessage({ eventKey, data, desc })
				this.emitLocal(eventKey, data, desc)
			})
	}
}
