import Datachannel from './datachannel'
import { EventEmitter } from './tool'
export default class WebRTCChart extends EventEmitter {
  constructor(pc) {
    super()
    this.dcManager = new Datachannel(pc, this)
    this.emit = this.dcManager.send.bind(this.dcManager)
  }
}
