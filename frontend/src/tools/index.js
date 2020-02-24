export * from './device'

export * from './file-reader'

export * from './point-free'
export * from './event-emitter'

export const randomStr = function(len) {
    len = len || 32
    let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz234567890_'
    let maxPos = $chars.length
    let str = ''
    for (let i = 0; i < len; i++) {
      str += $chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return str
  }