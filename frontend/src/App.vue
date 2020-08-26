<template>
	<div :class="['web-rtc', { 'rtc-mobile': isMobile }]">
		<Rooms @create-room="start" @call="call"></Rooms>

		<transition name="play">
			<div class="play">
				<nav v-if="isMobile">
					<!-- <div class="back" @click="isShowVideo = false">&lt; 返回房间</div> -->
					<div class="back" @click="isShowChat = !isShowChat">&#8593; 聊天</div>
				</nav>
				<play :streams="streams"> </play>
				<div class="self-btns">
					<i
						class="iconfont icon-mic"
						:class="{ active: slefVideoBtnStatus.audio }"
						@click="selfMediaStatusChange('audio')"
					></i>
					<i
						class="iconfont icon-video"
						:class="{ active: slefVideoBtnStatus.video }"
						@click="selfMediaStatusChange('video')"
					></i>
					<i
						class="iconfont icon-desktopshare"
						:class="{ active: slefVideoBtnStatus.desktopShare }"
						@click="selfMediaStatusChange('desktopShare')"
					></i>
					<i
						class="iconfont icon-camera-switch"
						:class="{ active: slefVideoBtnStatus.cameraSwitch }"
						@click="selfMediaStatusChange('cameraSwitch')"
					></i>
				</div>
			</div>
		</transition>
		<chat
			:chats="chats"
			v-if="peersLength && (isShowChat || !isMobile)"
			:isMobile="isMobile"
			@send="send"
		></chat>
	</div>
</template>

<script>
import Rooms from '@/views/rooms'
import RTCManager from '@/views/rtc-manager'

import Chat from '@/views/chat'
import { isMobile, fileLoad } from '@/tools'
import Play from '@/views/play'
import socket from '@/socket'

const rtcManager = new RTCManager()

window.rtcManager = rtcManager
export default {
	components: {
		Rooms,
		Play,
		Chat,
	},
	data() {
		return {
			shiftdown: false,
			streams: [],
			/**
			 * {pendingSize, size,isSelf, user,fileName}
			 */
			chats: [],
			isShowChat: false,
			peersLength: 0,
			slefVideoBtnStatus: { audio: false, desktopShare: false, video: false, cameraSwitch: false },
		}
	},
	computed: {
		isMobile() {
			return isMobile
		},
	},

	methods: {
		selfMediaStatusChange(type) {
			console.log(type)
			rtcManager
				.setSelfMediaStatus({
					...this.slefVideoBtnStatus,
					[type]: !this.slefVideoBtnStatus[type],
				})
				.then(res => {
					this.slefVideoBtnStatus[type] = !this.slefVideoBtnStatus[type]
				})
		},
		start(data) {
			rtcManager.clear()
			rtcManager.createRoom(data)
		},

		call(picked) {
			rtcManager.clear()
			rtcManager.call(picked)
		},

		sendTexts(texts) {
			if (!texts.length) return
			texts.forEach(text => {
				const sendData = {
					msg: text,
					user: socket.id,
					type: 'text',
				}
				rtcManager.dcData.emit('chat', sendData)
				this.getChatText({ ...sendData, isSelf: true })
			})
		},

		async sendFiles(files) {
			files.forEach(it => {
				/*
        *       type: 'file',
        file: it.file,
        fileName,
        hash: it.hash,
        */
				const { file, ...data } = it

				const chatMsg = {
					...data,
					isSelf: true,
					percent: 0,
					total: 0,
					sendSize: 0,
				}
				if (it.type === 'video' || it.type === 'img') {
					this.getMedia(file, chatMsg)
				} else {
					this.chats.push(chatMsg)
				}

				const key = {
					video: 'chat-video',
					img: 'chat-img',
					file: 'chat-file',
				}[it.type]

				rtcManager.dcFile.emit(key, file, {
					...data,
					user: socket.id,
				})(e => {
					chatMsg.total = e.total
					chatMsg.sendSize = e.sendSize
					chatMsg.percent = e.percent
				})
			})
		},
		async getMedia(blob, desc) {
			const file = URL.createObjectURL(blob)
			desc.file = file
			this.chats.push(desc)
		},

		send(e) {
			this.sendFiles(e.files)
			this.sendTexts(e.texts)
		},

		async getFile(data, desc) {
			fileLoad({ data, name: desc.fileName })
		},
		async getChatText(chat) {
			this.chats.push(chat)
		},

		_streamChange(streams) {
			this.streams = streams
		},

		_peersChange(peers) {
			this.peersLength = peers.length
		},
		getChatFileProgress(e) {
			let chat = this.chats.find(it => it.hash === e.desc.hash)
			if (!chat) {
				chat = { ...e.desc, percent: e.percent }
				this.chats.push(chat)
			}
			chat.percent = e.percent
		},
	},
	created() {
		rtcManager.on('streams', this._streamChange).on('peers:change', this._peersChange)

		rtcManager.dcData.on('chat', this.getChatText)
		rtcManager.dcFile
			.on('chat-file', this.getFile)
			.on('chat-file:progress', this.getChatFileProgress)
			.on('chat-video', this.getMedia)
			.on('chat-img', this.getMedia)
	},
}
</script>

<style lang="scss">
video {
	outline: none;
}
// .web-rtc.rtc-mobile {
// 	grid-template-columns: 1fr;
// 	padding: 20px;
// 	.chat-enter {
// 		transform: translateY(100%);
// 	}
// 	.chat-enter-to {
// 		transform: translateY(0);
// 	}
// 	.chat-leave {
// 		transform: translateY(0);
// 	}
// 	.chat-leave-to {
// 		transform: translateY(100%);
// 	}

// 	.chat {
// 		position: fixed;
// 		top: 0;
// 		right: 0;
// 		left: 0;
// 		bottom: 0;
// 		background: #fff;
// 		display: flex;
// 		flex-direction: column;
// 		padding: 20px;
// 		transition: all 0.3s;

// 		nav {
// 			display: flex;
// 			justify-content: flex-end;
// 			margin-bottom: 10px;
// 		}
// 		.content {
// 			min-height: 200px;
// 			height: auto;
// 			flex: 3 1 200px;
// 		}
// 		.edit-content {
// 			flex: 1;
// 		}
// 	}
// 	.play-enter,
// 	.play-leave-to {
// 		transform: translateX(100%);
// 	}
// 	.play-enter-to,
// 	.play-leave {
// 		transform: translateX(0);
// 	}
// 	div.play {
// 		position: fixed;
// 		top: 0;
// 		bottom: 0;
// 		left: 0;
// 		right: 0;
// 		background: #fff;
// 		transition: all 0.3s;
// 		padding: 20px;

// 		.back {
// 			margin-bottom: 10px;
// 			color: #666;
// 		}
// 	}
// }

.web-rtc {
	max-width: 1553px;
	margin: 0 auto;

	padding: 40px;
	display: grid;
	grid-template-columns: 200px 4fr 400px;
	grid-gap: 0 10px;
	.play {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		min-width: 460px;
		border: 1px solid #ccc;
		position: relative;
		.self-btns {
			position: absolute;
			bottom: 0;
			width: 100%;
			height: 36px;
			display: flex;
			justify-content: space-around;
			align-items: center;
			& > i {
				font-size: 26px;
				color: #666;
				&.active {
					color: #47b384;
				}
			}
		}
		nav {
			display: flex;
			justify-content: space-between;
			width: 100%;
		}

	}

	.rtc-room {
		height: calc(100vh - 90px);
	}
}
</style>
