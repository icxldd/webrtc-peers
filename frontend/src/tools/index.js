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

export function findDiff(originObj, newObj) {
	if (
		!({}.toString.call(originObj) === '[object Object]') ||
		!({}.toString.call(newObj) === '[object Object]')
	) {
		throw 'arguments need two object'
	}

	return diff(originObj, newObj)

	function diff(originObj, newObj, data = {}) {
		for (let key in newObj) {
			if (JSON.stringify(originObj[key]) === JSON.stringify(newObj[key])) {
				continue
			}

			if ({}.toString.call(newObj[key]) !== '[object Object]') {
				data[key] = JSON.parse(JSON.stringify(newObj[key]))
				continue
			}
			data[key] = {}
			diff(originObj[key], newObj[key], data[key])
		}
		return data
	}
}
