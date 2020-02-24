export  class EventEmitter {
  events = {}
  emitLocal(key, ...data) {
    if (this.events[key]) {
      this.events[key].forEach(it => it(...data))
    }
    return this
  }

  on(key, fn) {
    if(typeof fn !=='function') throw new Error('secend argument must be function')
    if (!this.events[key]) {
      this.events[key] = []
    }
    this.events[key].push(fn)
    return this
  }

  off(key, fn) {
    if (!this.events[key]) {
      return false
    }
    if (!fn) {
      return (this.events[key] = null)
    }

    this.events[key] = this.events[key].filter(it => it !== fn)
    return this
  }
}