const UA = navigator.userAgent.toLowerCase()

/**
 * [isWeChat 微信]
 * @type {Boolean}
 */
export const isWeChat = !!(UA.match(/MicroMessenger/i) == 'micromessenger')

export const isMobile = !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA)

export const isWeChatWork = !!/wxwork/i.test(UA)

export const isEpa = isWeChatWork

export const isIos = !!/iPhone|iPad|iPod/i.test(UA)

